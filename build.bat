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

echo [2/3] Building elevated helper...
cd elevated
go build -ldflags "-H windowsgui -s -w" -o ../build/bin/CCoolerElevated.exe
if errorlevel 1 (
    echo Helper build failed!
    cd ..
    exit /b 1
)
cd ..

echo [3/3] Build complete!
echo ========================================
echo Main: build\bin\CCooler.exe
echo Helper: build\bin\CCoolerElevated.exe
echo ========================================
