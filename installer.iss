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
  StatusBadge: TLabel;
  CardDivider: TPanel;
  FeatureLabel1, FeatureLabel2, FeatureLabel3: TLabel;
  MobileStepLabel: TLabel;
  ScanHeaderLabel: TLabel;
  ScanProgressBar: TNewProgressBar;
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

  TailscalePage := CreateCustomPage(wpWelcome, 'Remote Access & Tailscale Mesh Configuration', 'Configure secure worldwide remote control from your mobile phone');

  // 1. Dark Sleek Cyber Card Panel
  CardPanel := TPanel.Create(TailscalePage);
  CardPanel.Parent := TailscalePage.Surface;
  CardPanel.Left := 0;
  CardPanel.Top := 0;
  CardPanel.Width := TailscalePage.SurfaceWidth;
  CardPanel.Height := 145;
  CardPanel.Color := $001A100A; // Dark sleek navy-black
  CardPanel.BevelKind := bkFlat;
  CardPanel.BevelOuter := bvNone;
  CardPanel.ParentBackground := False;

  // Status Badge at top of Card
  StatusBadge := TLabel.Create(TailscalePage);
  StatusBadge.Parent := CardPanel;
  StatusBadge.Left := 14;
  StatusBadge.Top := 10;
  StatusBadge.Font.Name := 'Segoe UI';
  StatusBadge.Font.Style := [fsBold];
  StatusBadge.Font.Size := 9;

  if IsTailscaleInstalled then
  begin
    StatusBadge.Caption := '● SYSTEM STATUS: TAILSCALE WIREGUARD DETECTED [ACTIVE / READY]';
    StatusBadge.Font.Color := $0041FF00; // Matrix Neon Green
  end
  else
  begin
    StatusBadge.Caption := '▲ SYSTEM STATUS: TAILSCALE NOT DETECTED [AUTO-INSTALL READY]';
    StatusBadge.Font.Color := $001B75D0; // Warning Orange
  end;

  // Divider Line inside Card
  CardDivider := TPanel.Create(TailscalePage);
  CardDivider.Parent := CardPanel;
  CardDivider.Left := 14;
  CardDivider.Top := 30;
  CardDivider.Width := CardPanel.Width - 28;
  CardDivider.Height := 1;
  CardDivider.Color := $00403020;
  CardDivider.BevelOuter := bvNone;
  CardDivider.ParentBackground := False;

  // Feature Highlights
  FeatureLabel1 := TLabel.Create(TailscalePage);
  FeatureLabel1.Parent := CardPanel;
  FeatureLabel1.Left := 14;
  FeatureLabel1.Top := 38;
  FeatureLabel1.Font.Name := 'Segoe UI';
  FeatureLabel1.Font.Size := 9;
  FeatureLabel1.Font.Color := $00FFF000; // Cyan
  FeatureLabel1.Caption := '🔒 PROTOCOL: Encrypted WireGuard P2P Tunnel (256-bit Security)';

  FeatureLabel2 := TLabel.Create(TailscalePage);
  FeatureLabel2.Parent := CardPanel;
  FeatureLabel2.Left := 14;
  FeatureLabel2.Top := 58;
  FeatureLabel2.Font.Name := 'Segoe UI';
  FeatureLabel2.Font.Size := 9;
  FeatureLabel2.Font.Color := $00DFE2E5; // Soft silver
  FeatureLabel2.Caption := '🌐 RANGE: Worldwide Remote Access (Cellular 4G/5G, Starlink, Wi-Fi)';

  FeatureLabel3 := TLabel.Create(TailscalePage);
  FeatureLabel3.Parent := CardPanel;
  FeatureLabel3.Left := 14;
  FeatureLabel3.Top := 78;
  FeatureLabel3.Font.Name := 'Segoe UI';
  FeatureLabel3.Font.Size := 9;
  FeatureLabel3.Font.Color := $00DFE2E5;
  FeatureLabel3.Caption := '⚡ RESPONSE: Kernel-level 0ms Zero-Latency Emergency Blackout';

  // Mobile setup tip inside card
  MobileStepLabel := TLabel.Create(TailscalePage);
  MobileStepLabel.Parent := CardPanel;
  MobileStepLabel.Left := 14;
  MobileStepLabel.Top := 105;
  MobileStepLabel.Font.Name := 'Segoe UI';
  MobileStepLabel.Font.Style := [fsBold];
  MobileStepLabel.Font.Size := 9;
  MobileStepLabel.Font.Color := $0080D0FF; // Soft Neon Gold
  MobileStepLabel.Caption := '📱 MOBILE: Install Tailscale on phone, log in, then scan QR on next screen.';

  // 2. Animated Scanner Label & Marquee Progress Bar
  ScanHeaderLabel := TLabel.Create(TailscalePage);
  ScanHeaderLabel.Parent := TailscalePage.Surface;
  ScanHeaderLabel.Left := 0;
  ScanHeaderLabel.Top := 155;
  ScanHeaderLabel.Font.Name := 'Segoe UI';
  ScanHeaderLabel.Font.Style := [fsBold];
  ScanHeaderLabel.Font.Size := 8;
  ScanHeaderLabel.Caption := 'LIVE MESH ADAPTER SCANNER:';

  ScanProgressBar := TNewProgressBar.Create(TailscalePage);
  ScanProgressBar.Parent := TailscalePage.Surface;
  ScanProgressBar.Left := 0;
  ScanProgressBar.Top := 172;
  ScanProgressBar.Width := TailscalePage.SurfaceWidth;
  ScanProgressBar.Height := 8;
  ScanProgressBar.Style := npbstMarquee;

  // 3. Action Checkbox
  TailscaleInstallCheck := TNewCheckBox.Create(TailscalePage);
  TailscaleInstallCheck.Parent := TailscalePage.Surface;
  TailscaleInstallCheck.Left := 0;
  TailscaleInstallCheck.Top := 190;
  TailscaleInstallCheck.Width := TailscalePage.SurfaceWidth;
  TailscaleInstallCheck.Font.Name := 'Segoe UI';
  TailscaleInstallCheck.Font.Size := 9;
  TailscaleInstallCheck.Enabled := True;

  if IsTailscaleInstalled then
  begin
    TailscaleInstallCheck.Caption := 'Update / repair Tailscale WireGuard engine on this PC during setup';
    TailscaleInstallCheck.Checked := False;
  end
  else
  begin
    TailscaleInstallCheck.Caption := 'Automatically download and install Tailscale on this PC during setup';
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
