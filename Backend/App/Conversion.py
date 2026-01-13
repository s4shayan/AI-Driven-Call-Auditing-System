from pydub import AudioSegment

def get_audio_duration(file_path):
    audio = AudioSegment.from_file(file_path)  # supports mp3, wav, etc.
    duration_sec = len(audio) / 1000  # duration in seconds
    duration_min = duration_sec / 60   # convert to minutes
    return f"{duration_min:.2f}"       # round to 2 decimal places and return as string
