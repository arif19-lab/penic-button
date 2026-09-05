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
OutputDir=c:\Users\Imran\panic-button\dist
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
  CardPanel: TPanel;
  CardStripe: TPanel;
  StatusTitleLabel: TLabel;
  StatusSubLabel: TLabel;
  SectionTitleLabel: TLabel;
  StepLabel1, StepLabel2, StepLabel3: TLabel;
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
begin
  IsTailscaleInstalled := CheckIfTailscaleInstalled();

  TailscalePage := CreateCustomPage(wpWelcome, 'Remote Access Configuration', 'Configure encrypted remote emergency control for your mobile device');

  // 1. Clean Modern Hero Status Card (Windows 11 Card Style)
  CardPanel := TPanel.Create(TailscalePage);
  CardPanel.Parent := TailscalePage.Surface;
  CardPanel.Left := 0;
  CardPanel.Top := 6;
  CardPanel.Width := TailscalePage.SurfaceWidth;
  CardPanel.Height := 62;
  CardPanel.BevelKind := bkFlat;
  CardPanel.BevelOuter := bvNone;
  CardPanel.ParentBackground := False;

  // Left Accent Stripe
  CardStripe := TPanel.Create(TailscalePage);
  CardStripe.Parent := CardPanel;
  CardStripe.Left := 0;
  CardStripe.Top := 0;
  CardStripe.Width := 4;
  CardStripe.Height := CardPanel.Height;
  CardStripe.BevelOuter := bvNone;
  CardStripe.ParentBackground := False;

  // Status Title
  StatusTitleLabel := TLabel.Create(TailscalePage);
  StatusTitleLabel.Parent := CardPanel;
  StatusTitleLabel.Left := 16;
  StatusTitleLabel.Top := 11;
  StatusTitleLabel.Font.Name := 'Segoe UI';
  StatusTitleLabel.Font.Style := [fsBold];
  StatusTitleLabel.Font.Size := 10;

  // Status Subtitle
  StatusSubLabel := TLabel.Create(TailscalePage);
  StatusSubLabel.Parent := CardPanel;
  StatusSubLabel.Left := 16;
  StatusSubLabel.Top := 33;
  StatusSubLabel.Font.Name := 'Segoe UI';
  StatusSubLabel.Font.Size := 9;

  if IsTailscaleInstalled then
  begin
    CardPanel.Color := $00F4FAF5; // Soft subtle green
    CardStripe.Color := $0022C55E; // Emerald Green stripe
    StatusTitleLabel.Caption := 'Tailscale WireGuard Mesh Detected [Ready]';
    StatusTitleLabel.Font.Color := $0015803D; // Forest green
    StatusSubLabel.Caption := 'Status: Node is ready for worldwide encrypted mobile pairing.';
    StatusSubLabel.Font.Color := $00374151;
  end
  else
  begin
    CardPanel.Color := $00FEF9EC; // Soft subtle amber
    CardStripe.Color := $00D97706; // Amber stripe
    StatusTitleLabel.Caption := 'Tailscale Engine Not Detected [Auto-Install Ready]';
    StatusTitleLabel.Font.Color := $00B45309; // Deep amber
    StatusSubLabel.Caption := 'Status: Setup can automatically download and configure Tailscale for you.';
    StatusSubLabel.Font.Color := $004B5563;
  end;

  // 2. Clean Feature / Step Section
  SectionTitleLabel := TLabel.Create(TailscalePage);
  SectionTitleLabel.Parent := TailscalePage.Surface;
  SectionTitleLabel.Left := 0;
  SectionTitleLabel.Top := 84;
  SectionTitleLabel.Font.Name := 'Segoe UI';
  SectionTitleLabel.Font.Style := [fsBold];
  SectionTitleLabel.Font.Size := 9;
  SectionTitleLabel.Font.Color := $00111827;
  SectionTitleLabel.Caption := 'How Worldwide Mobile Security Works:';

  StepLabel1 := TLabel.Create(TailscalePage);
  StepLabel1.Parent := TailscalePage.Surface;
  StepLabel1.Left := 8;
  StepLabel1.Top := 108;
  StepLabel1.Font.Name := 'Segoe UI';
  StepLabel1.Font.Size := 9;
  StepLabel1.Font.Color := $00374151;
  StepLabel1.Caption := '1.  Encrypted Tunnel: Establishes a direct peer-to-peer WireGuard mesh.';

  StepLabel2 := TLabel.Create(TailscalePage);
  StepLabel2.Parent := TailscalePage.Surface;
  StepLabel2.Left := 8;
  StepLabel2.Top := 132;
  StepLabel2.Font.Name := 'Segoe UI';
  StepLabel2.Font.Size := 9;
  StepLabel2.Font.Color := $00374151;
  StepLabel2.Caption := '2.  Worldwide Access: Trigger emergency lock over cellular 4G/5G from anywhere.';

  StepLabel3 := TLabel.Create(TailscalePage);
  StepLabel3.Parent := TailscalePage.Surface;
  StepLabel3.Left := 8;
  StepLabel3.Top := 156;
  StepLabel3.Font.Name := 'Segoe UI';
  StepLabel3.Font.Size := 9;
  StepLabel3.Font.Color := $00374151;
  StepLabel3.Caption := '3.  Instant Pairing: A QR code pairing dashboard will open upon finish.';

  // 3. Action Checkbox (Clean & Spaced)
  TailscaleInstallCheck := TNewCheckBox.Create(TailscalePage);
  TailscaleInstallCheck.Parent := TailscalePage.Surface;
  TailscaleInstallCheck.Left := 0;
  TailscaleInstallCheck.Top := 194;
  TailscaleInstallCheck.Width := TailscalePage.SurfaceWidth;
  TailscaleInstallCheck.Font.Name := 'Segoe UI';
  TailscaleInstallCheck.Font.Size := 9;
  TailscaleInstallCheck.Enabled := True;

  if IsTailscaleInstalled then
  begin
    TailscaleInstallCheck.Caption := 'Update or reinstall Tailscale engine on this PC during setup';
    TailscaleInstallCheck.Checked := False;
  end
  else
  begin
    TailscaleInstallCheck.Caption := 'Automatically download and install Tailscale on this PC';
    TailscaleInstallCheck.Checked := True;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  ErrorCode: Integer;
begin
  if CurStep = ssPostInstall then
  begin
    if TailscaleInstallCheck.Checked then
    begin
      WizardForm.StatusLabel.Caption := 'Updating / Installing Tailscale WireGuard engine...';
      Exec('powershell.exe', '-WindowStyle Hidden -Command "winget install --id Tailscale.Tailscale --silent --accept-package-agreements --accept-source-agreements; if (!(Test-Path ''$env:ProgramFiles\Tailscale\tailscale.exe'')) { $t = \"$env:TEMP\tailscale-setup.msi\"; Invoke-WebRequest ''https://pkgs.tailscale.com/stable/tailscale-setup-latest.msi'' -OutFile $t; Start-Process msiexec.exe -ArgumentList \"/i `\"$t`\" /quiet /norestart\" -Wait; Remove-Item $t -Force -ErrorAction SilentlyContinue } sc.exe start Tailscale"', '', SW_HIDE, ewWaitUntilTerminated, ErrorCode);
    end;
  end
  else if CurStep = ssDone then
  begin
    Sleep(1200);
    ShellExec('open', 'http://127.0.0.1:8085/qr', '', '', SW_SHOWNORMAL, ewNoWait, ErrorCode);
  end;
end;
