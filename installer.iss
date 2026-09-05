[Setup]
AppId={{C658D203-FE5A-4DF1-9EB4-1B15F64BF192}
AppName=PANIC CTRL
AppVersion=2.5.0
AppPublisher=PANIC CTRL Team
AppPublisherURL=https://github.com/arif19-lab/penic-button
DefaultDirName={commonappdata}\PanicButton
DisableDirPage=yes
DefaultGroupName=PANIC CTRL
DisableProgramGroupPage=yes
OutputDir=C:\Users\Imran\OneDrive\AppData\Desktop
OutputBaseFilename=PanicCTRL-Setup
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "PanicButton.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "PanicProvider.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "libwinpthread-1.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "alarm*.wav"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\PANIC CTRL"; Filename: "{app}\PanicButton.exe"; WorkingDir: "{app}"
Name: "{autodesktop}\PANIC CTRL"; Filename: "{app}\PanicButton.exe"; Tasks: desktopicon; WorkingDir: "{app}"

[Run]
Filename: "{app}\PanicButton.exe"; Description: "{cm:LaunchProgram,PANIC CTRL}"; Flags: nowait postinstall skipifsilent
