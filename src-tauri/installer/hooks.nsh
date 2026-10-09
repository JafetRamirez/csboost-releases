; Ganchos do instalador do CSBoost.
; Na desinstalação (não em atualização), oferece desfazer todos os ajustes
; do Windows antes de remover o app — o Windows volta exatamente como estava.
; Texto no idioma do instalador: 1046 = português (Brasil), 1034/3082 = espanhol,
; qualquer outro = inglês.

!macro NSIS_HOOK_PREUNINSTALL
  ${If} $UpdateMode <> 1
    IfSilent csboost_skip_revert
    StrCpy $R8 "Do you want to undo the changes CSBoost made to Windows before removing it?$\r$\n$\r$\nYes: Windows goes back to how it was before CSBoost.$\r$\nNo: the changes stay in place.$\r$\n$\r$\nIf you are only updating CSBoost, click No."
    StrCpy $R9 "Undoing CSBoost changes..."
    ${If} $LANGUAGE == 1046
      StrCpy $R8 "Quer desfazer os ajustes que o CSBoost fez no Windows antes de remover o programa?$\r$\n$\r$\nSim: o Windows volta a ficar como estava antes do CSBoost.$\r$\nNão: os ajustes continuam valendo.$\r$\n$\r$\nSe você só está atualizando o CSBoost, clique em Não."
      StrCpy $R9 "Desfazendo os ajustes do CSBoost..."
    ${ElseIf} $LANGUAGE == 1034
    ${OrIf} $LANGUAGE == 3082
      StrCpy $R8 "¿Quieres deshacer los cambios que CSBoost hizo en Windows antes de quitar el programa?$\r$\n$\r$\nSí: Windows vuelve a quedar como estaba antes de CSBoost.$\r$\nNo: los cambios siguen aplicados.$\r$\n$\r$\nSi solo estás actualizando CSBoost, haz clic en No."
      StrCpy $R9 "Deshaciendo los cambios de CSBoost..."
    ${EndIf}
    MessageBox MB_YESNO|MB_ICONQUESTION "$R8" IDNO csboost_skip_revert
    DetailPrint "$R9"
    ExecWait '"$INSTDIR\csboost.exe" --revert-all'
    csboost_skip_revert:
  ${EndIf}
!macroend
