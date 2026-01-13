"""
Offline Speaker Diarization + Transcription
============================================
Uses faster-whisper for transcription and MFCC-based spectral clustering for diarization.
Works completely offline after first model download.

Usage:
    python diarize_transcribe.py --input "audio.mp3"
    python diarize_transcribe.py --input "audio.mp3" --num_speakers 2
    python diarize_transcribe.py --all  # Process all MP3 files in current directory
"""

import os
import argparse
import json
from pathlib import Path
from datetime import timedelta
import numpy as np
import warnings
warnings.filterwarnings("ignore")

# Audio processing
import librosa
import soundfile as sf
from pydub import AudioSegment

# Transcription
from faster_whisper import WhisperModel

# Clustering
from sklearn.cluster import AgglomerativeClustering
from sklearn.preprocessing import StandardScaler


def format_timestamp(seconds: float) -> str:
    """Convert seconds to SRT timestamp format HH:MM:SS,mmm"""
    td = timedelta(seconds=seconds)
    hours, remainder = divmod(int(td.total_seconds()), 3600)
    minutes, secs = divmod(remainder, 60)
    milliseconds = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{milliseconds:03d}"


def format_time_simple(seconds: float) -> str:
    """Convert seconds to simple HH:MM:SS format"""
    hours, remainder = divmod(int(seconds), 3600)
    minutes, secs = divmod(remainder, 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"


def convert_to_wav(input_path: str, output_path: str) -> str:
    """Convert audio file to WAV format (16kHz mono)"""
    print(f"  Converting to WAV...")
    audio = AudioSegment.from_file(input_path)
    audio = audio.set_frame_rate(16000).set_channels(1)
    audio.export(output_path, format="wav")
    return output_path


def transcribe_audio(wav_path: str, model_size: str = "base") -> list:
    """
    Transcribe audio using faster-whisper.
    Returns list of segments with start, end, and text.
    """
    print(f"  Loading Whisper model ({model_size})...")
    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    
    print(f"  Transcribing...")
    segments, info = model.transcribe(wav_path, beam_size=5, word_timestamps=True)
    
    result = []
    for segment in segments:
        result.append({
            "start": segment.start,
            "end": segment.end,
            "text": segment.text.strip()
        })
    
    print(f"  Found {len(result)} segments ({info.language} detected)")
    return result


def extract_audio_features(wav_path: str, segments: list) -> np.ndarray:
    """
    Extract MFCC-based audio features for each segment.
    Uses averaged MFCC coefficients as speaker-distinguishing features.
    """
    print(f"  Extracting audio features...")
    wav, sr = librosa.load(wav_path, sr=16000)
    
    features = []
    for seg in segments:
        start_sample = int(seg["start"] * sr)
        end_sample = int(seg["end"] * sr)
        segment_audio = wav[start_sample:end_sample]
        
        # Need minimum audio length for MFCC
        if len(segment_audio) < sr * 0.1:  # Less than 0.1 seconds
            segment_audio = np.pad(segment_audio, (0, int(sr * 0.1) - len(segment_audio)))
        
        try:
            # Extract MFCCs (mel-frequency cepstral coefficients)
            mfccs = librosa.feature.mfcc(y=segment_audio, sr=sr, n_mfcc=20)
            
            # Get statistics across time (mean and std for each coefficient)
            mfcc_mean = np.mean(mfccs, axis=1)
            mfcc_std = np.std(mfccs, axis=1)
            
            # Also add spectral features
            spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=segment_audio, sr=sr))
            spectral_bandwidth = np.mean(librosa.feature.spectral_bandwidth(y=segment_audio, sr=sr))
            zero_crossing_rate = np.mean(librosa.feature.zero_crossing_rate(segment_audio))
            
            # Combine all features
            feature_vector = np.concatenate([
                mfcc_mean, 
                mfcc_std, 
                [spectral_centroid, spectral_bandwidth, zero_crossing_rate]
            ])
            features.append(feature_vector)
        except Exception as e:
            # Use zeros for failed segments
            features.append(np.zeros(43))  # 20 + 20 + 3 features
    
    return np.array(features)


def cluster_speakers(features: np.ndarray, num_speakers: int = 2) -> list:
    """
    Cluster features to identify unique speakers.
    Returns list of speaker labels.
    """
    print(f"  Clustering {len(features)} segments into {num_speakers} speakers...")
    
    if len(features) < 2:
        return [0] * len(features)
    
    # Ensure we don't have more clusters than samples
    num_speakers = min(num_speakers, len(features))
    
    try:
        # Normalize features
        scaler = StandardScaler()
        features_normalized = scaler.fit_transform(features)
        
        # Use Agglomerative Clustering
        clustering = AgglomerativeClustering(
            n_clusters=num_speakers,
            metric='euclidean',
            linkage='ward'
        )
        labels = clustering.fit_predict(features_normalized)
        return labels.tolist()
    except Exception as e:
        print(f"  Warning: Clustering failed ({e}), using alternating pattern")
        return [i % num_speakers for i in range(len(features))]


def merge_consecutive_segments(segments: list) -> list:
    """Merge consecutive segments from the same speaker"""
    if not segments:
        return segments
    
    merged = [segments[0].copy()]
    
    for seg in segments[1:]:
        if seg["speaker"] == merged[-1]["speaker"]:
            # Merge with previous segment
            merged[-1]["end"] = seg["end"]
            merged[-1]["text"] += " " + seg["text"]
        else:
            merged.append(seg.copy())
    
    return merged


def apply_temporal_smoothing(segments: list, labels: list, min_duration: float = 1.0) -> list:
    """
    Apply temporal smoothing to reduce rapid speaker switching.
    Short segments surrounded by same speaker are reassigned.
    """
    if len(labels) < 3:
        return labels
    
    smoothed = labels.copy()
    
    for i in range(1, len(labels) - 1):
        seg_duration = segments[i]["end"] - segments[i]["start"]
        
        # If segment is short and surrounded by same speaker, reassign
        if seg_duration < min_duration:
            if labels[i-1] == labels[i+1] and labels[i] != labels[i-1]:
                smoothed[i] = labels[i-1]
    
    return smoothed


def save_json(segments: list, output_path: str, filename: str):
    """Save results as JSON"""
    speakers = list(set(seg["speaker"] for seg in segments))
    
    # Calculate duration for each speaker
    speaker_durations = {}
    for seg in segments:
        spk = seg["speaker"]
        duration = seg["end"] - seg["start"]
        speaker_durations[spk] = speaker_durations.get(spk, 0) + duration
    
    result = {
        "filename": filename,
        "speakers": speakers,
        "speaker_durations": {k: round(v, 2) for k, v in speaker_durations.items()},
        "num_segments": len(segments),
        "segments": segments
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)


def save_txt(segments: list, output_path: str):
    """Save results as human-readable text"""
    with open(output_path, 'w', encoding='utf-8') as f:
        for seg in segments:
            start = format_time_simple(seg["start"])
            end = format_time_simple(seg["end"])
            f.write(f"[{start} - {end}] {seg['speaker']}: {seg['text']}\n\n")


def save_srt(segments: list, output_path: str):
    """Save results as SRT subtitle file"""
    with open(output_path, 'w', encoding='utf-8') as f:
        for i, seg in enumerate(segments, 1):
            start = format_timestamp(seg["start"])
            end = format_timestamp(seg["end"])
            f.write(f"{i}\n")
            f.write(f"{start} --> {end}\n")
            f.write(f"[{seg['speaker']}] {seg['text']}\n\n")


def process_audio(input_path: str, output_dir: str, num_speakers: int = 2, model_size: str = "base"):
    """Main processing function for a single audio file"""
    input_path = Path(input_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(exist_ok=True)
    
    filename = input_path.stem
    print(f"\n{'='*60}")
    print(f"Processing: {input_path.name}")
    print(f"{'='*60}")
    
    # Step 1: Convert to WAV
    wav_path = output_dir / f"{filename}_temp.wav"
    convert_to_wav(str(input_path), str(wav_path))
    
    # Step 2: Transcribe
    segments = transcribe_audio(str(wav_path), model_size)
    
    if not segments:
        print("  No speech detected!")
        wav_path.unlink(missing_ok=True)
        return
    
    # Step 3: Extract audio features
    features = extract_audio_features(str(wav_path), segments)
    
    # Step 4: Cluster speakers
    labels = cluster_speakers(features, num_speakers)
    
    # Step 5: Apply temporal smoothing
    labels = apply_temporal_smoothing(segments, labels)
    
    # Step 6: Assign speaker labels
    if num_speakers == 3:
        for seg, label in zip(segments, labels):
            seg["speaker"] = f"SPEAKER_{label + 1}"
    else:
        # Agent speaks first, Customer second
        # Find which cluster ID appears first in the conversation
        first_speaker_cluster = labels[0] if labels else 0
        
        for seg, label in zip(segments, labels):
            if label == first_speaker_cluster:
                seg["speaker"] = "AGENT"
            else:
                seg["speaker"] = "CUSTOMER"
    
    # Step 7: Merge consecutive segments from same speaker
    merged_segments = merge_consecutive_segments(segments)
    
    # Round timestamps
    for seg in merged_segments:
        seg["start"] = round(seg["start"], 2)
        seg["end"] = round(seg["end"], 2)
    
    # Step 8: Save outputs
    print(f"  Saving results...")
    save_json(merged_segments, output_dir / f"{filename}_diarized.json", input_path.name)
    save_txt(merged_segments, output_dir / f"{filename}_transcript.txt")
    save_srt(merged_segments, output_dir / f"{filename}.srt")
    
    # Cleanup temp fi
    wav_path.unlink(missing_ok=True)
    
    unique_speakers = len(set(seg["speaker"] for seg in merged_segments))
    print(f"  ✓ Done! Found {unique_speakers} speakers, {len(merged_segments)} segments")
    print(f"  Output saved to: {output_dir}")
    
    # Print sample output
    print(f"\n  Preview:")
    for seg in merged_segments[:5]:
        start = format_time_simple(seg["start"])
        text = seg["text"][:60] + "..." if len(seg["text"]) > 60 else seg["text"]
        print(f"    [{start}] {seg['speaker']}: {text}")
    if len(merged_segments) > 5:
        print(f"    ... and {len(merged_segments) - 5} more segments")
    
    return merged_segments


def main():
    parser = argparse.ArgumentParser(
        description="Offline Speaker Diarization + Transcription",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python diarize_transcribe.py --input "audio.mp3"
  python diarize_transcribe.py --all
  python diarize_transcribe.py --input "audio.mp3" --num_speakers 3 --model small
        """
    )
    parser.add_argument(
        "--input", "-i",
        type=str,
        help="Input audio file path"
    )
    parser.add_argument(
        "--all", "-a",
        action="store_true",
        help="Process all MP3 files in current directory"
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        default="./output",
        help="Output directory (default: ./output)"
    )
    parser.add_argument(
        "--num_speakers", "-n",
        type=int,
        default=2,
        help="Number of speakers (default: 2 for agent+customer calls)"
    )
    parser.add_argument(
        "--model", "-m",
        type=str,
        default="base",
        choices=["tiny", "base", "small", "medium", "large-v2", "large-v3"],
        help="Whisper model size (default: base). Larger = more accurate but slower"
    )
    
    args = parser.parse_args()
    
    if args.all:
        # Process all MP3 files
        mp3_files = list(Path(".").glob("*.mp3"))
        if not mp3_files:
            print("No MP3 files found in current directory!")
            return
        
        print(f"Found {len(mp3_files)} MP3 files to process")
        for mp3_file in mp3_files:
            try:
                process_audio(str(mp3_file), args.output, args.num_speakers, args.model)
            except Exception as e:
                print(f"Error processing {mp3_file}: {e}")
    
    elif args.input:
        if not os.path.exists(args.input):
            print(f"Error: File not found: {args.input}")
            return
        process_audio(args.input, args.output, args.num_speakers, args.model)
    
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
