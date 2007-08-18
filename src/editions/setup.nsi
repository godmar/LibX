#Install script for LibX-IE
!define PRODUCT_NAME "LibX for IE"
!define PRODUCT_VERSION "1.0"
!define PRODUCT_PUBLISHER "Virginia Tech"
!define PRODUCT_WEB_SITE "http://www.libx.org"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

!define PRODUCT_REGISTRY_KEY "Software\LibX for IE"
!define PRODUCT_DATA_STORE "$APPDATA\LibX"

#Needs the following symbols:
# DLL_PATH:      Path to LibXIE core DLLs
# DLL_URL        URL to download dependencies
# JS_PATH:       Path to LibX JavaScript files
# LOCALE_PATH:   Path to LibX locale base directory
# LOCALE:        Locale ID (like en-US)
# EDITION_PATH:  Output directory
# EDITION_ID:    Edition short ID (vt for the Virginia Tech edition, say)

SetCompressor bzip2

# Modern UI
!include "MUI.nsh"

# MUI Settings
#!define MUI_ABORTWARNING       # Warn user if install is canceled in midstream
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

# Welcome page
!insertmacro MUI_PAGE_WELCOME
# License page
!insertmacro MUI_PAGE_LICENSE "${DLL_PATH}MPL-1.1.txt"
# Directory page
!insertmacro MUI_PAGE_DIRECTORY
# Files to install page
!insertmacro MUI_PAGE_INSTFILES
# Finish page
!insertmacro MUI_PAGE_FINISH

# Uninstaller pages
!insertmacro MUI_UNPAGE_INSTFILES

# Language files
!insertmacro MUI_LANGUAGE "English"

# Reserve files
!insertmacro MUI_RESERVEFILE_INSTALLOPTIONS

Name "${PRODUCT_NAME}"
OutFile "${EDITION_PATH}libx-${EDITION_ID}.exe"
InstallDir "$PROGRAMFILES\LibX for IE"
#Get installation folder from registry if available
InstallDirRegKey HKCU "${PRODUCT_REGISTRY_KEY}" "Directory"

XPStyle on

ShowInstDetails show
ShowUnInstDetails show

# Download the file on the stack if it doesn't exist in the directory on the stack
# Params:
#   Directory
#   File
Function getDependency
  Pop $1 #File
  Pop $0 #Directory
  IfFileExists "$0\$1" +6
    NSISdl::download "${DLL_URL}/$1" "$0\$1"
    Pop $R0 ;Get the return value
    StrCmp $R0 "success" +3
      MessageBox MB_OK "Download of necessary component failed: $R0"
      Quit
FunctionEnd

Function getResource
  Pop $2 #File
  Pop $1 #ResourceID
  Pop $0 #Directory
  
  IfFileExists "$0\$1" +6
    NSISdl::download "${DLL_URL}/$1/$2" "$0\$1\$2"
    Pop $R0 ;Get the return value
    StrCmp $R0 "success" +3
      MessageBox MB_OK "Download of necessary component failed: $R0"
      Quit
FunctionEnd

Section "Pre-Install Download" SEC00
  # Make the install dir
  CreateDirectory "$INSTDIR"
  CreateDirectory "$INSTDIR\en-US"
  CreateDirectory "$INSTDIR\ja"

  # MS XML 6 section ################################################
  
  # Check to see if we have MSXML6
  IfFileExists "$SYSDIR\msxml6.dll" +6
    Push "$TEMP"
    Push "msxml6.msi"
    Call getDependency # Download installer to temp dir
    nsExec::ExecToLog 'msiexec /quiet "$TEMP\msxml6.msi"' # Install
    Delete "$TEMP\msxml6.msi"

  # Check to see if we have the dependency files already
  Push "$INSTDIR"
  Push "ActivScp.dll"
  Call getDependency

  Push "$INSTDIR"
  Push "Interop.SHDocVw.dll"
  Call getDependency

  Push "$INSTDIR"
  Push "Interop.MSXML2.dll"
  Call getDependency
  
  Push "$INSTDIR"
  Push "Microsoft.mshtml.dll"
  Call getDependency

  Push "$INSTDIR"
  Push "stdole.dll"
  Call getDependency

  Push "$INSTDIR"
  Push "GACMeUp.exe"
  Call getDependency
  
  Push "$INSTDIR\"
  Push "en-US"
  Push "LibXIE.resources.dll"
  Call getResource
  
  Push "$INSTDIR"
  Push "ja"
  Push "LibXIE.resources.dll"
  Call getResource
SectionEnd

Section "LibX Core" SEC01
  SetOverwrite ifdiff
  SetOutPath "$INSTDIR"
  # Toolbar files
  File "${DLL_PATH}LibXIE.dll"
  # Needed to register assemblies
  File "${DLL_PATH}Register.bat"
  File "${DLL_PATH}Unregister.bat"
SectionEnd

Section "LibX JavaScript" SEC02
  SetOverwrite ifdiff
  SetOutPath "${PRODUCT_DATA_STORE}\content"
  File "${JS_PATH}proxy.js"
  File "${JS_PATH}libx.js"
  File "${JS_PATH}libx.ie.js"
  File "${JS_PATH}prefs.js"
  File "${JS_PATH}prefs.ie.js"
  File "${JS_PATH}config.js"
  File "${JS_PATH}config.ie.js"
  File "${JS_PATH}openurl.js"
  File "${JS_PATH}contextMenuUtils.js"
  File "${JS_PATH}menuObjects.js"
  File "${JS_PATH}isbnutils.js"
  File "${JS_PATH}doiutils.js"
  File "${JS_PATH}magicsearch.js"
  File "${JS_PATH}libxprefs.js"
  File "${JS_PATH}doforurl.js"
  SetOutPath "${PRODUCT_DATA_STORE}\content\catalogs"
  File "${JS_PATH}catalogs/*.js"
SectionEnd

Section "LibX Locale" SEC03
  SetOverwrite ifdiff
  SetOutPath "${PRODUCT_DATA_STORE}\locale\${LOCALE}"
  File "${LOCALE_PATH}${LOCALE}/libx/definitions.properties"
SectionEnd

Section "Edition" SEC04
  SetOverwrite on
# $editionfiles$
SectionEnd

Section -Post # Post-install registry manipulation
  SetOutPath "$INSTDIR"
  WriteUninstaller "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  
  #Let's turn off some IE security hacks (er, I mean features)
  WriteRegDWORD HKLM "SOFTWARE\Microsoft\Internet Explorer\Main\FeatureControl\FEATURE_LOCALMACHINE_LOCKDOWN" \
                "LibXIE.dll" 0x0
  
  #Store install location
  WriteRegStr HKCU "${PRODUCT_REGISTRY_KEY}" "Directory" $INSTDIR
  
  # Register in GAC and for interop
  nsExec::ExecToLog '"$INSTDIR\Register.bat"'
SectionEnd

##############Uninstall

Function un.onInit
  MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 \
             "Uninstalling the LibX toolbar for IE will completely remove the toolbar and all its functionality. Continue?" \
             /SD IDYES IDYES +2
  Abort
FunctionEnd

Function un.onUninstSuccess
  HideWindow
  MessageBox MB_ICONINFORMATION|MB_OK \
             "LibX for IE was successfully removed from your computer." \
             /SD IDOK
FunctionEnd

Section Uninstall
  SetOutPath "$INSTDIR"
  # Deregister
  nsExec::ExecToLog '"$INSTDIR\Unregister.bat"'
  
  SetOutPath "$TEMP"
  
  # Remove edition files
  #$deleteeditionfiles$
  # Remove JavaScript files
  Delete "${PRODUCT_DATA_STORE}\content\catalogs\*.js"
  Delete "${PRODUCT_DATA_STORE}\content\*.js"
  
  # Remove toolbar files
  Delete "$INSTDIR\installLog.txt"
  Delete "$INSTDIR\uninst.exe"
  Delete "$INSTDIR\ja\LibXIE.resources.dll"
  Delete "$INSTDIR\en-US\LibXIE.resources.dll"
  Delete "$INSTDIR\Interop.SHDocVw.dll"
  Delete "$INSTDIR\Interop.MSXML2.dll"
  Delete "$INSTDIR\Microsoft.mshtml.dll"
  Delete "$INSTDIR\ActivScp.dll"
  Delete "$INSTDIR\LibXIE.dll"
  Delete "$INSTDIR\stdole.dll"
  Delete "$INSTDIR\GACMeUp.exe"
  Delete "$INSTDIR\Register.bat"
  Delete "$INSTDIR\Unregister.bat"

  # Remove directories
  RMDir "$INSTDIR\ja"
  RMDir "$INSTDIR\en-US"
  RMDir "${PRODUCT_DATA_STORE}\skin"
  RMDir "${PRODUCT_DATA_STORE}\content\catalogs"
  RMDir "${PRODUCT_DATA_STORE}\content"
  RMDir /r "${PRODUCT_DATA_STORE}\locale"
  RMDir "${PRODUCT_DATA_STORE}"
  RMDir "$INSTDIR"

  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  SetAutoClose true
SectionEnd
