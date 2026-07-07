@echo off
title 業務日報・現場台帳 社内LANサーバー(Python版)
echo ===================================================
echo  業務日報・現場台帳 社内LANサーバー(Python)を起動しています...
echo ===================================================
python server.py
if %errorlevel% neq 0 (
    echo.
    echo [エラー] Python がインストールされていないか、起動に失敗しました。
    pause
)
