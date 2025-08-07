#!/usr/bin/env python3
"""
Transcriber: Extracts audio from video and saves transcript to /app/static/audio/
Compatible with Docker virtual environment and Ubuntu 22.04
Optimized for x86_64 architecture with Python 3.10.12
"""

import speech_recognition as sr
from pydub import AudioSegment
from moviepy.editor import VideoFileClip
import os
import tempfile
import argparse
import sys
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_environment():
    """Check Docker environment and dependencies"""
    logger.info("🔍 Environment Check:")
    logger.info(f"   Python: {sys.version.split()[0]}")
    logger.info(f"   Virtual Env: {os.environ.get('VIRTUAL_ENV', 'None')}")
    logger.info(f"   Working Dir: {os.getcwd()}")
    logger.info(f"   Architecture: {os.environ.get('ARCH', 'unknown')}")

    # Check required directories
    static_dir = Path("/app/static")
    if not static_dir.exists():
        logger.warning(f"Static directory not found: {static_dir}")

    # Check ffmpeg
    import subprocess
    try:
        result = subprocess.run(['ffmpeg', '-version'],
                              capture_output=True, text=True, timeout=5)
        logger.info("   FFmpeg: Available ✓")
    except Exception:
        logger.warning("   FFmpeg: Not available ⚠️")

def ensure_directories():
    """Ensure required directories exist with proper permissions"""
    try:
        # Create audio output directory
        audio_dir = Path("/app/static/audio")
        audio_dir.mkdir(parents=True, exist_ok=True)

        # Create temp directory for processing
        temp_dir = Path("/app/temp")
        temp_dir.mkdir(exist_ok=True)

        logger.info(f"📁 Output directory: {audio_dir}")
        logger.info(f"📁 Temp directory: {temp_dir}")

        return audio_dir, temp_dir

    except PermissionError as e:
        logger.error(f"Permission error creating directories: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error creating directories: {e}")
        sys.exit(1)

def extract_audio_from_video(video_path, output_dir):
    """Extract audio from video file using moviepy"""
    logger.info(f"🎬 Extracting audio from: {video_path}")

    base_name = Path(video_path).stem
    audio_path = output_dir / f"{base_name}_extracted.wav"

    try:
        # Load video file
        logger.info("   Loading video file...")
        clip = VideoFileClip(str(video_path))

        # Check for audio presence
        if clip.audio is None:
            logger.error("   No audio track found in video")
            clip.close()
            return None

        # Write audio to WAV
        logger.info(f"   Writing audio to: {audio_path}")
        clip.audio.write_audiofile(
            str(audio_path),
            codec="pcm_s16le",
            verbose=False
        )

        logger.info("   Audio extraction completed ✓")
        return str(audio_path)

    except Exception as e:
        logger.error(f"   Audio extraction failed: {e}")
        return None

    finally:
        try:
            clip.close()
        except Exception:
            pass

def convert_to_wav(file_path, output_dir):
    """Convert audio file to WAV format"""
    logger.info(f"🔄 Converting to WAV: {Path(file_path).name}")

    try:
        # Load audio file
        audio = AudioSegment.from_file(file_path)

        # Generate output path
        base_name = Path(file_path).stem
        wav_path = output_dir / f"{base_name}_converted.wav"

        # Export as WAV
        audio.export(str(wav_path), format="wav")
        logger.info(f"   Converted to: {wav_path}")

        return str(wav_path)

    except Exception as e:
        logger.error(f"   Conversion failed: {e}")
        sys.exit(1)

def transcribe_audio_chunks(audio_path, language='en-US'):
    """Transcribe audio file by splitting into chunks"""
    logger.info(f"🎤 Starting transcription...")
    logger.info(f"   Language: {language}")

    try:
        # Load audio
        audio = AudioSegment.from_wav(audio_path)
        duration = len(audio) / 1000  # Duration in seconds
        logger.info(f"   Audio duration: {duration:.2f} seconds")

        # Split into chunks (30 seconds each)
        chunk_length_ms = 30 * 1000
        chunks = [audio[i:i + chunk_length_ms]
                 for i in range(0, len(audio), chunk_length_ms)]

        logger.info(f"   Split into {len(chunks)} chunks")

        # Initialize speech recognizer
        recognizer = sr.Recognizer()
        recognizer.energy_threshold = 300
        recognizer.dynamic_energy_threshold = True

        full_text = ""
        successful_chunks = 0

        # Process each chunk
        for i, chunk in enumerate(chunks):
            chunk_num = i + 1
            logger.info(f"   Processing chunk {chunk_num}/{len(chunks)}")

            temp_file_path = None
            try:
                # Create temporary file for chunk
                with tempfile.NamedTemporaryFile(
                    delete=False,
                    suffix=".wav",
                    dir="/app/temp"
                ) as temp_file:
                    temp_file_path = temp_file.name
                    chunk.export(temp_file_path, format="wav")

                # Transcribe chunk
                with sr.AudioFile(temp_file_path) as source:
                    # Adjust for ambient noise
                    recognizer.adjust_for_ambient_noise(source, duration=0.5)
                    audio_data = recognizer.record(source)

                    # Recognize speech
                    text = recognizer.recognize_google(audio_data, language=language)

                    if text.strip():
                        full_text += text + " "
                        successful_chunks += 1
                        preview = text[:50] + "..." if len(text) > 50 else text
                        logger.info(f"     ✓ '{preview}'")
                    else:
                        logger.info(f"     ⚠️ Empty result")

            except sr.UnknownValueError:
                logger.info(f"     ⚠️ Could not understand audio")
            except sr.RequestError as e:
                logger.error(f"     ❌ API request error: {e}")
            except Exception as e:
                logger.error(f"     ❌ Unexpected error: {e}")
            finally:
                # Clean up temporary file
                if temp_file_path and os.path.exists(temp_file_path):
                    try:
                        os.unlink(temp_file_path)
                    except:
                        pass

        logger.info(f"📊 Transcription completed: {successful_chunks}/{len(chunks)} chunks successful")
        return full_text.strip(), successful_chunks, len(chunks)

    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        sys.exit(1)

def save_transcript(text, original_file_path, output_dir):
    """Save transcript to text file"""
    # Generate output filename
    base_name = Path(original_file_path).stem
    if base_name.endswith(('_extracted', '_converted', '_temp')):
        base_name = base_name.split('_')[0]

    output_path = output_dir / f"{base_name}_transcript.txt"

    try:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(text)

        logger.info(f"💾 Transcript saved: {output_path}")
        logger.info(f"📝 Text length: {len(text)} characters")

        return str(output_path)

    except Exception as e:
        logger.error(f"Failed to save transcript: {e}")
        sys.exit(1)

def cleanup_temp_files(*file_paths):
    """Clean up temporary files"""
    for file_path in file_paths:
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"🗑️ Cleaned up: {Path(file_path).name}")
            except Exception as e:
                logger.warning(f"Could not remove {file_path}: {e}")

def main():
    """Main transcription function"""
    parser = argparse.ArgumentParser(
        description="🎬 Rudrashtakam Transcriber - Docker Edition",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python transcriber.py --video static/videos/Rudrashtakam.mp4
  python transcriber.py --video /app/static/videos/sample.mp4 --language hi-IN
        """
    )

    parser.add_argument(
        "--video",
        required=True,
        help="Path to video or audio file"
    )
    parser.add_argument(
        "--language",
        default="en-US",
        help="Language for speech recognition (default: en-US)"
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging"
    )

    args = parser.parse_args()

    # Set debug logging if requested
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    print("🔱 Rudrashtakam Transcriber v3.0 - Docker Edition")
    print("=" * 60)

    # Check environment
    check_environment()

    # Validate input file
    input_path = Path(args.video)
    if not input_path.exists():
        logger.error(f"❌ Input file not found: {input_path}")
        sys.exit(1)

    logger.info(f"📂 Input file: {input_path}")
    logger.info(f"📦 File size: {input_path.stat().st_size / (1024*1024):.2f} MB")

    # Ensure directories exist
    audio_dir, temp_dir = ensure_directories()

    temp_files = []

    try:
        # Determine file type and process accordingly
        file_ext = input_path.suffix.lower()
        video_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv'}
        audio_extensions = {'.wav', '.mp3', '.m4a', '.flac', '.ogg'}

        if file_ext in video_extensions:
            # Extract audio from video
            audio_path = extract_audio_from_video(str(input_path), temp_dir)
            temp_files.append(audio_path)

        elif file_ext in audio_extensions:
            # Convert audio to WAV if needed
            if file_ext != '.wav':
                audio_path = convert_to_wav(str(input_path), temp_dir)
                temp_files.append(audio_path)
            else:
                audio_path = str(input_path)
        else:
            logger.error(f"❌ Unsupported file format: {file_ext}")
            sys.exit(1)

        # Transcribe audio
        transcript, successful, total = transcribe_audio_chunks(audio_path, args.language)

        if transcript:
            # Save transcript
            output_path = save_transcript(transcript, str(input_path), audio_dir)

            print("\n" + "=" * 60)
            print("🎉 TRANSCRIPTION COMPLETED SUCCESSFULLY!")
            print(f"📄 Output: {output_path}")
            print(f"📊 Success Rate: {successful}/{total} chunks ({successful/total*100:.1f}%)")
            print(f"📝 Preview: {transcript[:100]}...")
            print("=" * 60)
        else:
            logger.warning("⚠️ No text could be extracted from the audio")

    except KeyboardInterrupt:
        logger.info("\n🛑 Transcription interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"\n❌ Fatal error: {e}")
        sys.exit(1)
    finally:
        # Clean up temporary files
        if temp_files:
            logger.info("🧹 Cleaning up temporary files...")
            cleanup_temp_files(*temp_files)

if __name__ == "__main__":
    main()   