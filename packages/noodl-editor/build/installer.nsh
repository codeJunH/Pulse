; Pulse Installer Custom Script
; 설치 경로에 자동으로 Pulse 폴더 추가

!macro customInit
  ; 기본 설치 경로를 Program Files\Pulse로 설정
  StrCpy $INSTDIR "$PROGRAMFILES\Pulse"
!macroend

; 설치 경로 변경 시 자동으로 Pulse 폴더 추가를 위한 함수
Function .onVerifyInstDir
  ; 경로 끝이 \Pulse가 아니면 추가
  StrCpy $R0 $INSTDIR -6
  StrCmp $R0 "\Pulse" end
  StrCpy $R0 $INSTDIR -5  
  StrCmp $R0 "Pulse" end
  
  ; Pulse 폴더 추가
  StrCpy $R1 $INSTDIR 1 -1
  StrCmp $R1 "\" addPulse
  StrCpy $INSTDIR "$INSTDIR\Pulse"
  Goto end
  
  addPulse:
  StrCpy $INSTDIR "$INSTDIRPulse"
  
  end:
FunctionEnd

; 바탕화면 바로가기 생성
!macro customInstallMode
  ; 바탕화면 바로가기를 기본으로 체크된 상태로 설정
  SetShellVarContext all
!macroend

; 설치 완료 후 추가 작업
!macro customFinishPageAction
  ; 설치 완료 메시지
!macroend

; 언어 설정
!macro customLanguages
  ; 영어 언어팩 포함
  LoadLanguageFile "${NSISDIR}\Contrib\Language files\English.nlf"
!macroend 