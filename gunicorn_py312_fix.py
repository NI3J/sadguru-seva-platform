"""
Compatibility fix for Gunicorn on Python 3.12
Fixes the pkgutil.ImpImporter issue before gunicorn imports pkg_resources

This must be imported BEFORE gunicorn is imported.
Usage: Set PYTHONSTARTUP environment variable or import this module first.
"""
import sys
import pkgutil

# Python 3.12 removed pkgutil.ImpImporter which older pkg_resources uses
# This shim provides a compatibility layer
if not hasattr(pkgutil, 'ImpImporter'):
    class ImpImporter:
        """Compatibility shim for removed pkgutil.ImpImporter"""
        def find_module(self, fullname, path=None):
            # Return None to indicate module not found (standard importer protocol)
            return None
    
    # Patch pkgutil before pkg_resources tries to use it
    pkgutil.ImpImporter = ImpImporter

# Pre-import pkg_resources to apply the patch
# This ensures the patch is in place before gunicorn.util tries to import it
try:
    import pkg_resources
    # Force initialization to catch any ImpImporter usage early
    if hasattr(pkg_resources, '_initialize_master_working_set'):
        try:
            pkg_resources._initialize_master_working_set()
        except:
            pass
except (ImportError, AttributeError):
    # If pkg_resources is not available or has issues, that's okay
    # Gunicorn 21.2.0+ may not need it, or we'll handle it gracefully
    pass
