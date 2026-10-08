; Ganchos do instalador do CSBoost.
; Na desinstalação (não em atualização), oferece desfazer todos os ajustes
; do Windows antes de remover o app — o Windows volta exatamente como estava.

!macro NSIS_HOOK_PREUNINSTALL
  ${If} $UpdateMode <> 1
    IfSilent csboost_skip_revert
    MessageBox MB_YESNO|MB_ICONQUESTION "Quer desfazer os ajustes que o CSBoost fez no Windows antes de remover o programa?$\r$\n$\r$\nSim: o Windows volta a ficar como estava antes do CSBoost.$\r$\nNão: os ajustes continuam valendo.$\r$\n$\r$\nSe você só está atualizando o CSBoost, clique em Não." IDNO csboost_skip_revert
    DetailPrint "Desfazendo os ajustes do CSBoost..."
    ExecWait '"$INSTDIR\csboost.exe" --revert-all'
    csboost_skip_revert:
  ${EndIf}
!macroend
