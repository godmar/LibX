#Install script for LibX-IE
!define PRODUCT_NAME "LibX for IE"
!define PRODUCT_VERSION "1.0"
!define PRODUCT_PUBLISHER "Virginia Tech"
!define PRODUCT_WEB_SITE "http://www.libx.org"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

#Needs the following symbols:
# DLL_PATH:      Path to LibXIE core DLLs
# JS_PATH:       Path to LibX JavaScript files
# LOCALE_PATH:   Path to LibX locale base directory
# LOCALE:        Locale ID (like en-US)

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
!insertmacro MUI_PAGE_LICENSE "MPL-1.1.txt"
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
OutFile "LibX for IE Setup.exe"
InstallDir "$PROGRAMFILES\LibX for IE"
ShowInstDetails show
ShowUnInstDetails show

Section "LibX Core" SEC01
  SetOverwrite ifnewer
  SetOutPath "$INSTDIR"
  # Toolbar files
  File "${DLL_PATH}\LibXIE.dll"
  File "${DLL_PATH}\ActivScp.dll"
  File "${DLL_PATH}\Interop.SHDocVw.dll"
  File "${DLL_PATH}\Interop.MSXML2.dll"
  File "${DLL_PATH}\Microsoft.mshtml.dll"
  File "${DLL_PATH}\stdole.dll"
  # Needed to register assemblies
  File "${DLL_PATH}\GACMeUp.exe"
  File "${DLL_PATH}\Register.bat"
  File "${DLL_PATH}\Unregister.bat"
  # String resources
  SetOutPath "$INSTDIR\en-US"
  File "${DLL_PATH}\en-US\LibXIE.resources.dll"
  SetOutPath "$INSTDIR\ja"
  File "${DLL_PATH}\ja\LibXIE.resources.dll"
SectionEnd

Section "LibX JavaScript" SEC02
  SetOverwrite ifnewer
  SetOutPath "$APPDATA\LibX\content"
  File "${JS_PATH}\proxy.js"
  File "${JS_PATH}\libx.js"
  File "${JS_PATH}\libx.ie.js"
  File "${JS_PATH}\prefs.js"
  File "${JS_PATH}\prefs.ie.js"
  File "${JS_PATH}\config.js"
  File "${JS_PATH}\config.ie.js"
  File "${JS_PATH}\openurl.js"
  File "${JS_PATH}\contextMenuUtils.js"
  File "${JS_PATH}\menuObjects.js"
  File "${JS_PATH}\isbnutils.js"
  File "${JS_PATH}\doiutils.js"
  SetOutPath "$APPDATA\LibX\content\catalogs"
  File "${JS_PATH}\catalogs\*.js"
SectionEnd

Section "LibX Locale" SEC03
  SetOverwrite ifnewer
  SetOutPath "$APPDATA\LibX\locale\${LOCALE}"
  File "${LOCALE_PATH}\${LOCALE}\libx\definitions.properties"
SectionEnd

Section "Edition" SEC04
  SetOverwrite ifnewer
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
  
  # Register in GAC and for interop
  ExecWait '$INSTDIR\Register.bat'
SectionEnd


Function un.onUninstSuccess
  HideWindow
  MessageBox MB_ICONINFORMATION|MB_OK "LibX for IE was successfully removed from your computer."
FunctionEnd

Function un.onInit
  MessageBox MB_ICONQUESTION|MB_YESNO|MB_DEFBUTTON2 "Uninstalling the LibX toolbar for IE will completely remove the toolbar and all its functionality. Continue?" IDYES +2
  Abort
FunctionEnd

Section Uninstall
  SetOutPath "$INSTDIR"
  # Deregister
  ExecWait '$INSTDIR\Unregister.bat'
  
  SetOutPath "$TEMP"
  
  # Remove edition files
  #$deleteeditionfiles$
  
  # Remove JavaScript files
  Delete "$APPDATA\LibX\content\catalogs\*.js"
  Delete "$APPDATA\LibX\content\*.js"
  
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
  RMDir "$APPDATA\LibX\skin"
  RMDir "$APPDATA\LibX\content\catalogs"
  RMDir "$APPDATA\LibX\content"
  RMDir "$APPDATA\LibX"
  RMDir "$INSTDIR"

  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  SetAutoClose true
SectionEnd