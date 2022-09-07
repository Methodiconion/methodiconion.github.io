@echo off
cls

set photoshop="C:\Program Files\PhotoshopPortable\App\PhotoshopCS4\Photoshop.exe"
set root=\\HP24143288702\Dropbox\LTS

for /f "delims=" %%d in ('dir %root% /ad /b') do set folder=%%d
echo %root%\%folder%

:main
set /p num="Image Number: "

set num=0000%num%
set num=%num:~-5%

set file=img_%num%.jpg
set filepath=%root%\%folder%\%file%
echo %filepath%

%photoshop% %filepath%

set filepath="%root%\%folder%\greenscreen\%file%"
echo %filepath%

%photoshop% %filepath%
goto main
