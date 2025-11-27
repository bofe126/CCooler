@echo off
echo ========================================
echo Building CCooler
echo ========================================

echo [1/3] Building main application...
call wails build
if errorlevel 1 (
    echo Main build failed!
    exit /b 1
)

echo [2/4] Installing rsrc tool if needed...
go install github.com/akavel/rsrc@latest 2>nul

echo [3/4] Compiling resource file...
cd elevated
rsrc -ico ../build/windows/icon.ico -o elevated.syso
if errorlevel 1 (
    echo Warning: rsrc failed, building without icon
    if exist elevated.syso del elevated.syso
)

echo [4/4] Building elevated helper...
go build -ldflags "-H windowsgui -s -w" -o ../build/bin/CCoolerElevated.exe
if errorlevel 1 (
    echo Helper build failed!
    cd ..
    exit /b 1
)
cd ..

echo [5/5] Build complete!
echo ========================================
echo Main: build\bin\CCooler.exe
echo Helper: build\bin\CCoolerElevated.exe
echo ========================================
