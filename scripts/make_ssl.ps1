$certDir = "C:\ProgramData\PanicButton\ssl"
if (!(Test-Path $certDir)) { New-Item -ItemType Directory -Path $certDir -Force }

# Generate 5-year self-signed RSA certificate
$cert = New-SelfSignedCertificate -DnsName "localhost", "panicctrl.local" -CertStoreLocation "Cert:\CurrentUser\My" -KeyExportPolicy Exportable -KeyLength 2048 -NotAfter (Get-Date).AddYears(5)

# Export Certificate (Public Key PEM)
$certBase64 = [System.Convert]::ToBase64String($cert.RawData, "InsertLineBreaks")
$certPem = "-----BEGIN CERTIFICATE-----`r`n" + $certBase64 + "`r`n-----END CERTIFICATE-----`r`n"
[System.IO.File]::WriteAllText("$certDir\cert.pem", $certPem)

# Export Private Key PFX and extract PKCS8 Private Key PEM
$pwd = ConvertTo-SecureString -String "panicctrl" -Force -AsPlainText
$pfxBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Pfx, "panicctrl")
[System.IO.File]::WriteAllBytes("$certDir\cert.pfx", $pfxBytes)

Write-Host "CERT AND PFX GENERATED SUCCESSFULLY!"
