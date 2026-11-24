Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\user\.gemini\antigravity\scratch\hece-zinciri"
WshShell.Run "cmd /c otomatik_baslat.bat", 0, False
