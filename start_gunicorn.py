#!/usr/bin/env python3
"""
Wrapper script to start Gunicorn with Python 3.12 compatibility fix
This applies the pkgutil.ImpImporter patch before importing gunicorn
"""
# Apply the fix FIRST, before any gunicorn imports
import gunicorn_py312_fix

# Now import and run gunicorn
import sys
import os

# Set up environment
os.environ.setdefault('PYTHONPATH', '.')

# Import gunicorn after the fix is applied
from gunicorn.app.wsgiapp import run

if __name__ == '__main__':
    # Replace script name with 'gunicorn' for proper argument parsing
    sys.argv[0] = 'gunicorn'
    sys.exit(run())
