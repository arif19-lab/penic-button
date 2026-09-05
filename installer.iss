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
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "PanicButton.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "PanicProvider.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "libwinpthread-1.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "alarm*.wav"; DestDir: "{app}"; Flags: ignoreversion

[InstallDelete]
Type: files; Name: "{app}\setup_shown.txt"

[Icons]
Name: "{autoprograms}\PANIC CTRL"; Filename: "{app}\PanicButton.exe"; WorkingDir: "{app}"
Name: "{autodesktop}\PANIC CTRL"; Filename: "{app}\PanicButton.exe"; Tasks: desktopicon; WorkingDir: "{app}"

[Run]
Filename: "{app}\PanicButton.exe"; Parameters: "--setup"; Description: "{cm:LaunchProgram,PANIC CTRL}"; Flags: nowait postinstall skipifsilent shellexec

[Code]
var
  TailscalePage: TWizardPage;
  TailscaleStatusLabel: TLabel;
  TailscaleInfoMemo: TNewMemo;
  TailscaleInstallCheck: TNewCheckBox;
  IsTailscaleInstalled: Boolean;

function CheckIfTailscaleInstalled(): Boolean;
var
  pf: String;
begin
  Result := False;
  pf := ExpandConstant('{commonpf}');
  if FileExists(pf + '\Tailscale\tailscale.exe') or FileExists(pf + '\Tailscale IPN\tailscale.exe') then
    Result := True;
  pf := ExpandConstant('{commonpf64}');
  if FileExists(pf + '\Tailscale\tailscale.exe') or FileExists(pf + '\Tailscale IPN\tailscale.exe') then
    Result := True;
end;

function InitializeSetup(): Boolean;
var
  ErrorCode: Integer;
begin
  Exec('taskkill.exe', '/F /IM PanicButton.exe', '', SW_HIDE, ewWaitUntilTerminated, ErrorCode);
  Result := True;
end;

procedure InitializeWizard();
var
  InfoText: String;
begin
  IsTailscaleInstalled := CheckIfTailscaleInstalled();

  TailscalePage := CreateCustomPage(wpWelcome, 'Remote Access & Tailscale Mesh Configuration', 'Configure secure worldwide remote control from your mobile phone');

  TailscaleStatusLabel := TLabel.Create(TailscalePage);
  TailscaleStatusLabel.Parent := TailscalePage.Surface;
  TailscaleStatusLabel.Left := 0;
  TailscaleStatusLabel.Top := 0;
  TailscaleStatusLabel.Width := TailscalePage.SurfaceWidth;
  TailscaleStatusLabel.Font.Style := [fsBold];
  TailscaleStatusLabel.Font.Size := 9;

  if IsTailscaleInstalled then
  begin
    TailscaleStatusLabel.Caption := 'System Status: Tailscale WireGuard Engine Detected [READY]';
    TailscaleStatusLabel.Font.Color := clGreen;
  end
  else
  begin
    TailscaleStatusLabel.Caption := 'System Status: Tailscale Not Detected [AUTO-INSTALL RECOMMENDED]';
    TailscaleStatusLabel.Font.Color := $001B75D0; // Orange
  end;

  TailscaleInfoMemo := TNewMemo.Create(TailscalePage);
  TailscaleInfoMemo.Parent := TailscalePage.Surface;
  TailscaleInfoMemo.Left := 0;
  TailscaleInfoMemo.Top := 26;
  TailscaleInfoMemo.Width := TailscalePage.SurfaceWidth;
  TailscaleInfoMemo.Height := 140;
  TailscaleInfoMemo.ReadOnly := True;
  TailscaleInfoMemo.ScrollBars := ssVertical;

  InfoText := 'WHY TAILSCALE IS NEEDED:' + #13#10 +
              '------------------------------------------------------------' + #13#10 +
              'PANIC CTRL uses Tailscale to establish an encrypted WireGuard' + #13#10 +
              'peer-to-peer tunnel between your PC and your phone. This enables' + #13#10 +
              'emergency lock and alarms from ANYWHERE in the world (even over' + #13#10 +
              'cellular 4G/5G, without port forwarding or public IP).' + #13#10#13#10 +
              'END-TO-END MOBILE SETUP STEPS:' + #13#10 +
              '1. Install Tailscale on your phone from Google Play Store' + #13#10 +
              '2. Sign in with the same account (Google/Microsoft/Apple) on PC & phone' + #13#10 +
              '3. After this setup completes, scan the QR code to pair your device.';

  TailscaleInfoMemo.Text := InfoText;

  TailscaleInstallCheck := TNewCheckBox.Create(TailscalePage);
  TailscaleInstallCheck.Parent := TailscalePage.Surface;
  TailscaleInstallCheck.Left := 0;
  TailscaleInstallCheck.Top := 176;
  TailscaleInstallCheck.Width := TailscalePage.SurfaceWidth;
  TailscaleInstallCheck.Caption := 'Automatically download and install Tailscale on this PC during setup';
  TailscaleInstallCheck.Checked := not IsTailscaleInstalled;
  TailscaleInstallCheck.Enabled := not IsTailscaleInstalled;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  ErrorCode: Integer;
begin
  if CurStep = ssPostInstall then
  begin
    if (not IsTailscaleInstalled) and TailscaleInstallCheck.Checked then
    begin
      WizardForm.StatusLabel.Caption := 'Installing Tailscale WireGuard engine...';
      Exec('powershell.exe', '-WindowStyle Hidden -Command "winget install --id Tailscale.Tailscale --silent --accept-package-agreements --accept-source-agreements; if (!(Test-Path ''$env:ProgramFiles\Tailscale\tailscale.exe'')) { $t = \"$env:TEMP\tailscale-setup.msi\"; Invoke-WebRequest ''https://pkgs.tailscale.com/stable/tailscale-setup-latest.msi'' -OutFile $t; Start-Process msiexec.exe -ArgumentList \"/i `\"$t`\" /quiet /norestart\" -Wait; Remove-Item $t -Force -ErrorAction SilentlyContinue } sc.exe start Tailscale"', '', SW_HIDE, ewWaitUntilTerminated, ErrorCode);
    end;
  end
  else if CurStep = ssDone then
  begin
    Sleep(1200);
    ShellExec('open', 'http://127.0.0.1:8085/qr', '', '', SW_SHOWNORMAL, ewNoWait, ErrorCode);
  end;
end;
