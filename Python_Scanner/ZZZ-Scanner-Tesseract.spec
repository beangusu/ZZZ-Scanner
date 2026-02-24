# -*- mode: python ; coding: utf-8 -*-

a = Analysis(
    [os.path.join(SPECPATH, 'orchestrator.py')],
    pathex=[],
    binaries=[],
    datas=[
        (os.path.join(SPECPATH, 'Target_Images'), 'Target_Images/'),
        (os.path.join(SPECPATH, 'Tesseract-OCR'), 'Tesseract-OCR/')
    ],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='ZZZ-Scanner-Tesseract',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    uac_admin=True,
    icon=[os.path.join(SPECPATH, '..', 'ZZZ-Frontend', 'renderer', 'public', 'images', 'ZZZ-Scanner-Icon.ico')],
    manifest=os.path.join(SPECPATH, 'autopytoexe', 'manifest.xml'),
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='ZZZ-Scanner-Tesseract',
)