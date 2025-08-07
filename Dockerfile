# 🔱 Base image (Ubuntu 22.04.5 LTS - Jammy Jellyfish)
FROM ubuntu:22.04

# 🌿 Environment Variables (Optimized for x86_64 architecture)
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    ARCH=x86_64 \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    UBUNTU_CODENAME=jammy \
    PIP_BREAK_SYSTEM_PACKAGES=1

# 🏗️ Architecture & System Info
RUN echo "Building for Ubuntu 22.04.5 LTS (Jammy Jellyfish)" && \
    echo "Target Architecture: x86_64" && \
    echo "Kernel compatibility: 5.15.0+ generic"

# ⚙️ Install System Dependencies (Ubuntu 22.04 Jammy packages)
RUN apt-get update && apt-get install -y \
    software-properties-common \
    build-essential \
    libffi-dev \
    libssl-dev \
    pkg-config \
    ffmpeg \
    git \
    wget \
    curl \
    ca-certificates \
    gnupg \
    lsb-release \
    python3 \
    python3-pip \
    python3-dev \
    python3-setuptools \
    python3-venv \
    python3-wheel \
    python3-distutils \
    # Remove problematic system packages that cause conflicts
    && apt-get remove -y python3-blinker python3-flask python3-werkzeug || true \
    && apt-get autoremove -y \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# 🔗 Python Setup (Ubuntu 22.04 uses Python 3.10.12 by default)
RUN python3 --version && \
    ln -sf /usr/bin/python3 /usr/bin/python && \
    ln -sf /usr/bin/pip3 /usr/bin/pip && \
    pip --version && \
    echo "Python environment configured for Ubuntu 22.04"

# 📍 Set Working Directory
WORKDIR /app

# 📥 Copy Application Files
COPY modules/transcriber.py ./transcriber.py
COPY app.py ./app.py
COPY static/ ./static/
COPY requirements.txt ./

# 🗂️ Create necessary directories with proper permissions
RUN mkdir -p /app/static/audio /app/temp /app/logs && \
    chmod 755 /app/static/audio /app/temp /app/logs

# 🧹 Clean conflicting packages and install fresh
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    # Remove any existing conflicting packages
    pip uninstall -y blinker flask werkzeug chardet idna || true && \
    # Create a virtual environment to avoid system conflicts
    python -m venv /opt/transcriber-env && \
    . /opt/transcriber-env/bin/activate && \
    pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir --timeout=100 -r requirements.txt && \
    pip install --no-cache-dir --timeout=100 \
        SpeechRecognition==3.10.4 \
        pydub==0.25.1 \
        numpy==1.24.4 \
        moviepy==1.0.3 \
        ffmpeg-python==0.2.0 \
        imageio==2.31.6 \
        imageio-ffmpeg==0.4.9 \
        chardet==5.2.0 \
        idna==3.6 \
        importlib-resources==6.1.1 \
        Flask==3.0.0 \
        Werkzeug==3.0.1 \
        blinker==1.7.0

# 🔄 Update PATH to use virtual environment
ENV PATH="/opt/transcriber-env/bin:$PATH"
ENV VIRTUAL_ENV="/opt/transcriber-env"

# 🙋 Non-root User Setup (Enhanced security for Ubuntu 22.04)
RUN useradd -m -u 1000 -s /bin/bash transcriber && \
    usermod -aG audio,video transcriber && \
    chown -R transcriber:transcriber /app /opt/transcriber-env && \
    chmod -R 755 /app

# 🔄 Switch to non-root user
USER transcriber

# 🫀 Health Check (Updated for Ubuntu 22.04 & Python 3.10)
HEALTHCHECK --interval=30s --timeout=15s --start-period=10s --retries=3 \
    CMD python -c "import flask, moviepy.editor, speech_recognition, wave, audioop, sys; print(f'All libraries OK - Python {sys.version}'); print('Ubuntu 22.04 compatibility verified')" || exit 1

# 🚪 Expose Application Port
EXPOSE 5000

# 🎞️ Default command - can be overridden
CMD ["python", "-u", "transcriber.py", "--video", "static/videos/Rudrashtakam.mp4"]
