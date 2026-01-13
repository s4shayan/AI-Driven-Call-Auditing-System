import whisper
import aiofiles
import asyncio
import tempfile

# load model ONCE
model = whisper.load_model("base")

async def transcribe_audio_bytes(audio_bytes: bytes):
    # Write to a temporary audio file
    async with aiofiles.tempfile.NamedTemporaryFile(
        delete=False, suffix=".mp3"
    ) as temp:
        await temp.write(audio_bytes)
        tmp_path = temp.name

    # Whisper is sync → run in thread
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        lambda: model.transcribe(tmp_path)
    )

    return result["text"]
