# Guias da central de ajuda: uma página por assunto, em pt, es e en.
# Endereços: /ajuda/<slug>/, /es/ayuda/<slug>/, /en/help/<slug>/.
# Dentro do texto, {{g:id}} vira o link do guia com esse id no mesmo idioma
# e {{dl}} vira o link de download. Sem travessão longo nos textos.
# O app abre estes guias pelos avisos do Raio-X (src/lib/help.ts usa os mesmos slugs).

GUIDES = [
# ─────────────────────────────── AUMENTAR FPS ───────────────────────────────
{
  "id": "fps",
  "slug": {"pt": "aumentar-fps-cs2", "es": "aumentar-fps-cs2", "en": "increase-fps-cs2"},
  "related": ["integrada", "xmp", "driver", "autoexec"],
  "pt": {
    "title": "Como aumentar o FPS no CS2: checklist do que mais pesa",
    "desc": "Checklist em ordem de impacto para ter mais FPS e 1% low mais estável no CS2: monitor, placa de vídeo, memória, driver, vídeo e Windows.",
    "h1": "Como aumentar o FPS no <em>CS2</em>",
    "lead": "A ordem importa. Os primeiros itens desta lista costumam valer mais do que todos os ajustes do Windows juntos.",
    "card": "Checklist em ordem de impacto: do monitor ao Windows.",
    "body": """
<h2>1. Monitor na taxa certa</h2>
<p>Monitor de 144 Hz ou mais rodando em 60 Hz é o problema mais comum. Confira em <strong>Configurações do Windows › Sistema › Tela › Tela avançada</strong> e escolha a maior taxa. Use cabo DisplayPort ou um HDMI que aguente essa taxa.</p>
<h2>2. CS2 na placa de vídeo certa</h2>
<p>Em PC de mesa, o cabo do monitor precisa estar na placa de vídeo, não na placa-mãe. Em notebook, o CS2 pode abrir no vídeo integrado e perder metade do FPS. Veja {{g:integrada}}.</p>
<h2>3. Notebook na tomada e plano de energia</h2>
<p>Na bateria, o notebook corta o desempenho de propósito. Jogue sempre na tomada e use um plano de energia de desempenho.</p>
<h2>4. Memória com XMP/EXPO e em dual channel</h2>
<p>Memória sem o perfil XMP/EXPO roda abaixo da velocidade dela, e um pente só trabalha com metade da banda. As duas coisas derrubam o 1% low, que é o que você sente como travadinha. Veja {{g:xmp}}.</p>
<h2>5. Driver de vídeo atualizado</h2>
<p>Drivers novos trazem correções para o CS2. Veja {{g:driver}}.</p>
<h2>6. Configurações de vídeo do jogo</h2>
<ul>
<li>NVIDIA Reflex ligado (ou a opção de baixa latência equivalente do jogo).</li>
<li>Sincronização vertical desligada.</li>
<li>Sombras, texturas e efeitos no baixo ou médio: a diferença visual é pequena e o ganho é grande em PC de entrada. Deixe as sombras dinâmicas em "Todas", porque ver a sombra do inimigo é vantagem.</li>
<li>No CSBoost, os presets de vídeo (FPS máximo, Equilibrado, Visibilidade) fazem isso com o jogo fechado e dá para desfazer.</li>
</ul>
<h2>7. O que roda junto com o jogo</h2>
<p>Navegador com muitas abas, downloads (Steam, torrents, atualizações) e gravação em segundo plano do Xbox Game Bar roubam recursos. Feche o que não usa durante a partida.</p>
<h2>8. Ajustes do Windows</h2>
<p>Plano de energia, gravação em segundo plano desligada, aceleração do mouse e outros ajustes deixam o sistema mais estável. Sozinhos raramente mudam muito o FPS médio, mas ajudam no 1% low. O CSBoost aplica cada um com o valor anterior guardado para desfazer.</p>
<h2>Como saber se melhorou</h2>
<p>Meça antes e depois no mesmo mapa, do mesmo jeito. Olhe o <strong>1% low</strong>, não só a média: é ele que mostra se o jogo ficou mais liso. O Benchmark do CSBoost faz essa medição com o PresentMon, a ferramenta aberta da Intel.</p>
""",
  },
  "es": {
    "title": "Cómo aumentar los FPS en CS2: checklist de lo que más pesa",
    "desc": "Checklist por orden de impacto para tener más FPS y un 1% low más estable en CS2: monitor, tarjeta gráfica, memoria, driver, video y Windows.",
    "h1": "Cómo aumentar los FPS en <em>CS2</em>",
    "lead": "El orden importa. Los primeros puntos de esta lista suelen valer más que todos los ajustes de Windows juntos.",
    "card": "Checklist por orden de impacto: del monitor a Windows.",
    "body": """
<h2>1. Monitor a la frecuencia correcta</h2>
<p>Un monitor de 144 Hz o más funcionando a 60 Hz es el problema más común. Revísalo en <strong>Configuración de Windows › Sistema › Pantalla › Pantalla avanzada</strong> y elige la frecuencia más alta. Usa cable DisplayPort o un HDMI que soporte esa frecuencia.</p>
<h2>2. CS2 en la tarjeta gráfica correcta</h2>
<p>En una PC de escritorio, el cable del monitor tiene que ir a la tarjeta gráfica, no a la placa madre. En una notebook, CS2 puede abrirse en el video integrado y perder la mitad de los FPS. Mira {{g:integrada}}.</p>
<h2>3. Notebook enchufada y plan de energía</h2>
<p>Con batería, la notebook recorta el rendimiento a propósito. Juega siempre enchufado y usa un plan de energía de rendimiento.</p>
<h2>4. Memoria con XMP/EXPO y en dual channel</h2>
<p>La memoria sin el perfil XMP/EXPO funciona por debajo de su velocidad, y un solo módulo trabaja con la mitad del ancho de banda. Las dos cosas bajan el 1% low, que es lo que sientes como tirones. Mira {{g:xmp}}.</p>
<h2>5. Driver de video actualizado</h2>
<p>Los drivers nuevos traen correcciones para CS2. Mira {{g:driver}}.</p>
<h2>6. Opciones de video del juego</h2>
<ul>
<li>NVIDIA Reflex activado (o la opción de baja latencia equivalente del juego).</li>
<li>Sincronización vertical desactivada.</li>
<li>Sombras, texturas y efectos en bajo o medio: la diferencia visual es poca y la mejora es grande en una PC de entrada. Deja las sombras dinámicas en "Todas", porque ver la sombra del enemigo es una ventaja.</li>
<li>En CSBoost, los presets de video (FPS máximo, Equilibrado, Visibilidad) hacen esto con el juego cerrado y se pueden deshacer.</li>
</ul>
<h2>7. Lo que corre junto con el juego</h2>
<p>El navegador con muchas pestañas, las descargas (Steam, torrents, actualizaciones) y la grabación en segundo plano de Xbox Game Bar roban recursos. Cierra lo que no uses durante la partida.</p>
<h2>8. Ajustes de Windows</h2>
<p>El plan de energía, la grabación en segundo plano desactivada, la aceleración del mouse y otros ajustes dejan el sistema más estable. Solos rara vez cambian mucho los FPS promedio, pero ayudan al 1% low. CSBoost aplica cada uno guardando el valor anterior para deshacer.</p>
<h2>Cómo saber si mejoró</h2>
<p>Mide antes y después en el mismo mapa, de la misma forma. Mira el <strong>1% low</strong>, no solo el promedio: es el que muestra si el juego quedó más fluido. El Benchmark de CSBoost hace esa medición con PresentMon, la herramienta abierta de Intel.</p>
""",
  },
  "en": {
    "title": "How to increase FPS in CS2: a checklist of what matters most",
    "desc": "A checklist ordered by impact for more FPS and steadier 1% lows in CS2: monitor, graphics card, memory, driver, video settings and Windows.",
    "h1": "How to increase FPS in <em>CS2</em>",
    "lead": "Order matters. The first items on this list are usually worth more than every Windows tweak combined.",
    "card": "A checklist ordered by impact: from the monitor to Windows.",
    "body": """
<h2>1. Monitor at the right refresh rate</h2>
<p>A 144 Hz+ monitor running at 60 Hz is the most common problem. Check it in <strong>Windows Settings › System › Display › Advanced display</strong> and pick the highest rate. Use a DisplayPort cable or an HDMI cable that supports that rate.</p>
<h2>2. CS2 on the right graphics card</h2>
<p>On a desktop, the monitor cable must go into the graphics card, not the motherboard. On a laptop, CS2 can open on the integrated graphics and lose half its FPS. See {{g:integrada}}.</p>
<h2>3. Laptop plugged in and power plan</h2>
<p>On battery, a laptop cuts performance on purpose. Always play plugged in and use a performance power plan.</p>
<h2>4. Memory with XMP/EXPO and in dual channel</h2>
<p>Memory without its XMP/EXPO profile runs below its rated speed, and a single stick works with half the bandwidth. Both drag down the 1% low, which is what you feel as stutter. See {{g:xmp}}.</p>
<h2>5. Up-to-date graphics driver</h2>
<p>New drivers bring fixes for CS2. See {{g:driver}}.</p>
<h2>6. In-game video settings</h2>
<ul>
<li>NVIDIA Reflex on (or the game's equivalent low-latency option).</li>
<li>Vertical sync off.</li>
<li>Shadows, textures and effects on low or medium: the visual difference is small and the gain is big on entry-level PCs. Leave dynamic shadows on "All", because seeing the enemy's shadow is an advantage.</li>
<li>In CSBoost, the video presets (Max FPS, Balanced, Visibility) do this with the game closed and can be undone.</li>
</ul>
<h2>7. What runs alongside the game</h2>
<p>A browser with lots of tabs, downloads (Steam, torrents, updates) and Xbox Game Bar background recording steal resources. Close what you don't use during the match.</p>
<h2>8. Windows tweaks</h2>
<p>Power plan, background recording off, mouse acceleration and other tweaks make the system steadier. On their own they rarely change average FPS much, but they help the 1% low. CSBoost applies each one and saves the previous value so you can undo it.</p>
<h2>How to tell if it improved</h2>
<p>Measure before and after on the same map, the same way. Look at the <strong>1% low</strong>, not just the average: it shows whether the game got smoother. CSBoost's Benchmark measures this with PresentMon, Intel's open tool.</p>
""",
  },
},
# ─────────────────────────────── XMP / EXPO ───────────────────────────────
{
  "id": "xmp",
  "slug": {"pt": "xmp-expo", "es": "xmp-expo", "en": "xmp-expo"},
  "related": ["resizable-bar", "fps"],
  "pt": {
    "title": "Como ativar XMP/EXPO na BIOS (ASUS, MSI, Gigabyte, ASRock)",
    "desc": "Passo a passo para ativar o perfil XMP (Intel) ou EXPO (AMD) da memória na BIOS das placas ASUS, MSI, Gigabyte e ASRock, e quando não dá.",
    "h1": "Como ativar <em>XMP/EXPO</em> na BIOS",
    "lead": "Memória gamer sai de fábrica numa velocidade básica. O perfil XMP (Intel) ou EXPO (AMD) faz ela rodar na velocidade da caixa, e o CS2 sente isso no 1% low.",
    "card": "Passo a passo por fabricante de placa-mãe.",
    "body": """
<h2>Antes de começar: confira a velocidade atual</h2>
<p>Abra o <strong>Gerenciador de Tarefas › Desempenho › Memória</strong> e veja o campo <strong>Velocidade</strong>. Compare com a velocidade da etiqueta do pente ou da caixa (por exemplo, DDR4-3200). Se já bate, não precisa fazer nada.</p>
<h2>Entrar na BIOS</h2>
<p>Reinicie o PC e aperte <strong>Del</strong> (ou <strong>F2</strong>) várias vezes enquanto ele liga. Em muitas placas a BIOS abre num modo simples (EZ Mode) que já tem o botão do XMP/EXPO na tela inicial.</p>
<h2>ASUS</h2>
<ul>
<li><strong>EZ Mode:</strong> procure <strong>X.M.P.</strong>, <strong>D.O.C.P.</strong> ou <strong>EXPO</strong> e escolha o Perfil 1.</li>
<li><strong>Modo avançado (F7):</strong> <strong>Ai Tweaker › Ai Overclock Tuner</strong> e escolha <strong>XMP I</strong> (Intel), <strong>D.O.C.P.</strong> ou <strong>EXPO</strong> (AMD).</li>
</ul>
<h2>MSI</h2>
<ul>
<li>No topo da tela inicial da BIOS (Click BIOS) tem o botão <strong>A-XMP</strong>, <strong>XMP</strong> ou <strong>EXPO</strong>. Clique e escolha o Perfil 1.</li>
<li>No modo avançado: <strong>OC › Extreme Memory Profile (XMP)</strong> ou <strong>A-XMP/EXPO</strong>.</li>
</ul>
<h2>Gigabyte (AORUS)</h2>
<ul>
<li><strong>Easy Mode:</strong> opção <strong>X.M.P.</strong> ou <strong>EXPO</strong> na tela inicial.</li>
<li>Modo avançado (F2): <strong>Tweaker › Extreme Memory Profile (X.M.P.)</strong> ou <strong>EXPO</strong> e escolha <strong>Profile1</strong>.</li>
</ul>
<h2>ASRock</h2>
<ul>
<li><strong>OC Tweaker › DRAM Configuration</strong> e, em <strong>Load XMP Setting</strong> ou <strong>DRAM Profile</strong>, escolha o perfil XMP/EXPO 1.</li>
</ul>
<p>Os nomes mudam um pouco entre modelos e versões de BIOS. Se não achar, procure o nome da sua placa-mãe e "XMP" no manual do fabricante.</p>
<h2>Salvar e testar</h2>
<ol>
<li>Aperte <strong>F10</strong> e confirme para salvar e reiniciar.</li>
<li>No Windows, confira de novo a velocidade no Gerenciador de Tarefas.</li>
<li>Rode o Raio-X do CSBoost: o aviso de memória deve sumir.</li>
</ol>
<p>Se o PC não ligar ou reiniciar sozinho, não se preocupe: depois de algumas tentativas a placa volta ao padrão. Tente o Perfil 2 ou uma velocidade um pouco menor. Se travar de vez, o manual da placa explica como limpar a CMOS.</p>
<h2>Quando não dá para ativar</h2>
<ul>
<li><strong>Placas Intel de linha H e B mais antigas</strong> (como H310, B360, B365, H410 e B460) limitam a memória à velocidade oficial do processador. Nelas, DDR4-2666 já é o máximo. A partir da série 500 (B560, H570) essas placas liberaram.</li>
<li><strong>PCs de marca</strong> (Dell, HP, Lenovo e outros prontos) e a maioria dos <strong>notebooks</strong> não têm essa opção na BIOS.</li>
<li>Se o Perfil 1 mostra a mesma velocidade que o Windows já mostra, seus pentes já estão no máximo deles.</li>
</ul>
<p>Nesses casos, no Raio-X do CSBoost clique em <strong>Já conferi, ignorar</strong> no aviso de memória.</p>
<h2>Bônus: dual channel</h2>
<p>Com dois pentes, coloque nos slots indicados no manual (na maioria das placas com 4 slots, o 2º e o 4º contando a partir do processador, marcados A2 e B2). Dois pentes iguais em dual channel ajudam muito o 1% low.</p>
""",
  },
  "es": {
    "title": "Cómo activar XMP/EXPO en la BIOS (ASUS, MSI, Gigabyte, ASRock)",
    "desc": "Paso a paso para activar el perfil XMP (Intel) o EXPO (AMD) de la memoria en la BIOS de placas ASUS, MSI, Gigabyte y ASRock, y cuándo no se puede.",
    "h1": "Cómo activar <em>XMP/EXPO</em> en la BIOS",
    "lead": "La memoria gamer sale de fábrica a una velocidad básica. El perfil XMP (Intel) o EXPO (AMD) la hace funcionar a la velocidad de la caja, y CS2 lo nota en el 1% low.",
    "card": "Paso a paso por fabricante de placa madre.",
    "body": """
<h2>Antes de empezar: revisa la velocidad actual</h2>
<p>Abre el <strong>Administrador de tareas › Rendimiento › Memoria</strong> y mira el campo <strong>Velocidad</strong>. Compárala con la velocidad de la etiqueta del módulo o de la caja (por ejemplo, DDR4-3200). Si ya coincide, no hace falta hacer nada.</p>
<h2>Entrar a la BIOS</h2>
<p>Reinicia la PC y presiona <strong>Supr</strong> (o <strong>F2</strong>) varias veces mientras enciende. En muchas placas la BIOS abre en un modo simple (EZ Mode) que ya tiene el botón de XMP/EXPO en la pantalla inicial.</p>
<h2>ASUS</h2>
<ul>
<li><strong>EZ Mode:</strong> busca <strong>X.M.P.</strong>, <strong>D.O.C.P.</strong> o <strong>EXPO</strong> y elige el Perfil 1.</li>
<li><strong>Modo avanzado (F7):</strong> <strong>Ai Tweaker › Ai Overclock Tuner</strong> y elige <strong>XMP I</strong> (Intel), <strong>D.O.C.P.</strong> o <strong>EXPO</strong> (AMD).</li>
</ul>
<h2>MSI</h2>
<ul>
<li>Arriba en la pantalla inicial de la BIOS (Click BIOS) está el botón <strong>A-XMP</strong>, <strong>XMP</strong> o <strong>EXPO</strong>. Haz clic y elige el Perfil 1.</li>
<li>En el modo avanzado: <strong>OC › Extreme Memory Profile (XMP)</strong> o <strong>A-XMP/EXPO</strong>.</li>
</ul>
<h2>Gigabyte (AORUS)</h2>
<ul>
<li><strong>Easy Mode:</strong> opción <strong>X.M.P.</strong> o <strong>EXPO</strong> en la pantalla inicial.</li>
<li>Modo avanzado (F2): <strong>Tweaker › Extreme Memory Profile (X.M.P.)</strong> o <strong>EXPO</strong> y elige <strong>Profile1</strong>.</li>
</ul>
<h2>ASRock</h2>
<ul>
<li><strong>OC Tweaker › DRAM Configuration</strong> y, en <strong>Load XMP Setting</strong> o <strong>DRAM Profile</strong>, elige el perfil XMP/EXPO 1.</li>
</ul>
<p>Los nombres cambian un poco entre modelos y versiones de BIOS. Si no lo encuentras, busca el nombre de tu placa madre y "XMP" en el manual del fabricante.</p>
<h2>Guardar y probar</h2>
<ol>
<li>Presiona <strong>F10</strong> y confirma para guardar y reiniciar.</li>
<li>En Windows, revisa de nuevo la velocidad en el Administrador de tareas.</li>
<li>Corre Rayos X en CSBoost: el aviso de memoria debería desaparecer.</li>
</ol>
<p>Si la PC no arranca o se reinicia sola, no te preocupes: después de algunos intentos la placa vuelve a la configuración original. Prueba el Perfil 2 o una velocidad un poco menor. Si se traba del todo, el manual de la placa explica cómo borrar la CMOS.</p>
<h2>Cuándo no se puede activar</h2>
<ul>
<li><strong>Placas Intel de línea H y B más antiguas</strong> (como H310, B360, B365, H410 y B460) limitan la memoria a la velocidad oficial del procesador. En ellas, DDR4-2666 ya es el máximo. Desde la serie 500 (B560, H570) esas placas lo permiten.</li>
<li><strong>PCs de marca</strong> (Dell, HP, Lenovo y otras armadas) y la mayoría de las <strong>notebooks</strong> no tienen esta opción en la BIOS.</li>
<li>Si el Perfil 1 muestra la misma velocidad que ya muestra Windows, tus módulos ya están en su máximo.</li>
</ul>
<p>En esos casos, en Rayos X de CSBoost haz clic en <strong>Ya lo revisé, ignorar</strong> en el aviso de memoria.</p>
<h2>Extra: dual channel</h2>
<p>Con dos módulos, ponlos en las ranuras que indica el manual (en la mayoría de las placas con 4 ranuras, la 2.ª y la 4.ª contando desde el procesador, marcadas A2 y B2). Dos módulos iguales en dual channel ayudan mucho al 1% low.</p>
""",
  },
  "en": {
    "title": "How to enable XMP/EXPO in the BIOS (ASUS, MSI, Gigabyte, ASRock)",
    "desc": "Step by step to enable the memory's XMP (Intel) or EXPO (AMD) profile in ASUS, MSI, Gigabyte and ASRock BIOS, and when you can't.",
    "h1": "How to enable <em>XMP/EXPO</em> in the BIOS",
    "lead": "Gaming memory ships at a basic speed. The XMP (Intel) or EXPO (AMD) profile makes it run at the speed on the box, and CS2 feels it in the 1% low.",
    "card": "Step by step for each motherboard brand.",
    "body": """
<h2>Before you start: check the current speed</h2>
<p>Open <strong>Task Manager › Performance › Memory</strong> and look at <strong>Speed</strong>. Compare it with the speed on the stick's label or box (for example, DDR4-3200). If it already matches, there's nothing to do.</p>
<h2>Enter the BIOS</h2>
<p>Restart the PC and press <strong>Del</strong> (or <strong>F2</strong>) repeatedly while it boots. On many boards the BIOS opens in a simple mode (EZ Mode) that already has the XMP/EXPO button on the first screen.</p>
<h2>ASUS</h2>
<ul>
<li><strong>EZ Mode:</strong> look for <strong>X.M.P.</strong>, <strong>D.O.C.P.</strong> or <strong>EXPO</strong> and choose Profile 1.</li>
<li><strong>Advanced mode (F7):</strong> <strong>Ai Tweaker › Ai Overclock Tuner</strong> and choose <strong>XMP I</strong> (Intel), <strong>D.O.C.P.</strong> or <strong>EXPO</strong> (AMD).</li>
</ul>
<h2>MSI</h2>
<ul>
<li>At the top of the BIOS home screen (Click BIOS) there is an <strong>A-XMP</strong>, <strong>XMP</strong> or <strong>EXPO</strong> button. Click it and choose Profile 1.</li>
<li>In advanced mode: <strong>OC › Extreme Memory Profile (XMP)</strong> or <strong>A-XMP/EXPO</strong>.</li>
</ul>
<h2>Gigabyte (AORUS)</h2>
<ul>
<li><strong>Easy Mode:</strong> the <strong>X.M.P.</strong> or <strong>EXPO</strong> option on the home screen.</li>
<li>Advanced mode (F2): <strong>Tweaker › Extreme Memory Profile (X.M.P.)</strong> or <strong>EXPO</strong> and choose <strong>Profile1</strong>.</li>
</ul>
<h2>ASRock</h2>
<ul>
<li><strong>OC Tweaker › DRAM Configuration</strong> and, under <strong>Load XMP Setting</strong> or <strong>DRAM Profile</strong>, choose XMP/EXPO profile 1.</li>
</ul>
<p>Names vary a bit between models and BIOS versions. If you can't find it, search your motherboard's manual for "XMP".</p>
<h2>Save and test</h2>
<ol>
<li>Press <strong>F10</strong> and confirm to save and restart.</li>
<li>In Windows, check the speed in Task Manager again.</li>
<li>Run CSBoost's PC Scan: the memory warning should be gone.</li>
</ol>
<p>If the PC doesn't boot or restarts by itself, don't worry: after a few tries the board goes back to defaults. Try Profile 2 or a slightly lower speed. If it gets stuck, the board's manual explains how to clear the CMOS.</p>
<h2>When you can't enable it</h2>
<ul>
<li><strong>Older Intel H- and B-series boards</strong> (such as H310, B360, B365, H410 and B460) lock memory to the processor's official speed. On them, DDR4-2666 is already the maximum. From the 500 series on (B560, H570) these boards allow it.</li>
<li><strong>Brand-name PCs</strong> (Dell, HP, Lenovo and other prebuilts) and most <strong>laptops</strong> don't have this BIOS option.</li>
<li>If Profile 1 shows the same speed Windows already shows, your sticks are already at their maximum.</li>
</ul>
<p>In those cases, click <strong>Already checked, ignore</strong> on the memory warning in CSBoost's PC Scan.</p>
<h2>Bonus: dual channel</h2>
<p>With two sticks, use the slots the manual recommends (on most 4-slot boards, the 2nd and 4th counting from the processor, labeled A2 and B2). Two matching sticks in dual channel help the 1% low a lot.</p>
""",
  },
},
# ─────────────────────────────── RESIZABLE BAR ───────────────────────────────
{
  "id": "resizable-bar",
  "slug": {"pt": "resizable-bar", "es": "resizable-bar", "en": "resizable-bar"},
  "related": ["xmp", "driver"],
  "pt": {
    "title": "Resizable BAR (Smart Access Memory): o que é e como ativar",
    "desc": "Como conferir e ativar o Resizable BAR (ReBAR) e o Smart Access Memory da AMD na BIOS, com o cuidado do CSM e do modo UEFI, e o ganho real no CS2.",
    "h1": "Resizable BAR: o que é e <em>como ativar</em>",
    "lead": "O Resizable BAR deixa o processador acessar toda a memória da placa de vídeo de uma vez. Na AMD ele se chama Smart Access Memory (SAM). Vale ativar, mas com um cuidado importante.",
    "card": "Como conferir, ativar com segurança e o ganho real.",
    "body": """
<h2>Ganho real no CS2</h2>
<p>Seja honesto com a expectativa: no CS2 o ganho costuma ser pequeno. Nas placas NVIDIA o driver só usa o recurso nos jogos que a NVIDIA liberou. Ainda assim, vale ligar, porque ajuda em outros jogos e não atrapalha.</p>
<h2>O que você precisa</h2>
<ul>
<li><strong>Placa de vídeo:</strong> NVIDIA RTX 30 ou mais nova, AMD Radeon RX 6000 ou mais nova, ou Intel Arc.</li>
<li><strong>Processador e placa-mãe:</strong> em geral, Intel de 10ª geração ou mais novo e AMD Ryzen 3000/5000 ou mais novo (exceto alguns modelos com vídeo integrado), com BIOS atualizada.</li>
<li><strong>Windows instalado em modo UEFI.</strong> Esse é o ponto que precisa de cuidado.</li>
</ul>
<h2>1. Confira se já está ligado</h2>
<ul>
<li><strong>NVIDIA:</strong> Painel de Controle da NVIDIA › <strong>Ajuda › Informações do sistema</strong> e procure <strong>Resizable BAR: Sim</strong>.</li>
<li><strong>AMD:</strong> abra o AMD Software: Adrenalin e procure <strong>Smart Access Memory</strong> (fica na área de desempenho/ajustes, na maioria das versões).</li>
</ul>
<h2>2. Confira o modo de inicialização (importante)</h2>
<p>Aperte <strong>Win + R</strong>, digite <code>msinfo32</code> e veja <strong>Modo da BIOS</strong>.</p>
<ul>
<li><strong>UEFI:</strong> pode seguir.</li>
<li><strong>Herdado (Legacy):</strong> <strong>pare aqui.</strong> Desligar o CSM neste caso faz o Windows não iniciar. Converter o disco para GPT é possível, mas é um procedimento à parte que não vale o risco só por este ajuste.</li>
</ul>
<h2>3. Ative na BIOS</h2>
<p>São duas opções: <strong>Above 4G Decoding</strong> (ligado) e <strong>Re-Size BAR Support</strong> (ligado ou Auto). O <strong>CSM</strong> precisa estar desligado. Onde costuma ficar:</p>
<ul>
<li><strong>ASUS:</strong> Advanced › PCI Subsystem Settings. CSM em Boot › CSM.</li>
<li><strong>MSI:</strong> Settings › Advanced › PCI Subsystem Settings. CSM em Settings › Advanced › Windows OS Configuration (escolha UEFI).</li>
<li><strong>Gigabyte:</strong> Settings › IO Ports. CSM em Boot › CSM Support.</li>
<li><strong>ASRock:</strong> Advanced › Chipset Configuration (às vezes como C.A.M., Clever Access Memory). CSM em Boot › CSM.</li>
</ul>
<p>Muitas BIOS novas têm um botão único de Resizable BAR na tela inicial. Salve com <strong>F10</strong>.</p>
<h2>4. Confirme</h2>
<p>De volta ao Windows, repita o passo 1. Se continuar desligado, atualize a BIOS da placa-mãe pelo site do fabricante e, em placas RTX 30 mais antigas, o firmware da placa de vídeo.</p>
""",
  },
  "es": {
    "title": "Resizable BAR (Smart Access Memory): qué es y cómo activarlo",
    "desc": "Cómo revisar y activar Resizable BAR (ReBAR) y Smart Access Memory de AMD en la BIOS, con el cuidado del CSM y del modo UEFI, y la mejora real en CS2.",
    "h1": "Resizable BAR: qué es y <em>cómo activarlo</em>",
    "lead": "Resizable BAR permite que el procesador acceda a toda la memoria de la tarjeta gráfica a la vez. En AMD se llama Smart Access Memory (SAM). Vale la pena activarlo, pero con un cuidado importante.",
    "card": "Cómo revisarlo, activarlo con seguridad y la mejora real.",
    "body": """
<h2>Mejora real en CS2</h2>
<p>Ten una expectativa honesta: en CS2 la mejora suele ser pequeña. En tarjetas NVIDIA el driver solo usa la función en los juegos que NVIDIA habilitó. Aun así, vale activarlo, porque ayuda en otros juegos y no molesta.</p>
<h2>Lo que necesitas</h2>
<ul>
<li><strong>Tarjeta gráfica:</strong> NVIDIA RTX 30 o más nueva, AMD Radeon RX 6000 o más nueva, o Intel Arc.</li>
<li><strong>Procesador y placa madre:</strong> en general, Intel de 10.ª generación o más nuevo y AMD Ryzen 3000/5000 o más nuevo (salvo algunos modelos con video integrado), con la BIOS actualizada.</li>
<li><strong>Windows instalado en modo UEFI.</strong> Este es el punto que requiere cuidado.</li>
</ul>
<h2>1. Revisa si ya está activado</h2>
<ul>
<li><strong>NVIDIA:</strong> Panel de control de NVIDIA › <strong>Ayuda › Información del sistema</strong> y busca <strong>Resizable BAR: Sí</strong>.</li>
<li><strong>AMD:</strong> abre AMD Software: Adrenalin y busca <strong>Smart Access Memory</strong> (está en la zona de rendimiento/ajustes en la mayoría de las versiones).</li>
</ul>
<h2>2. Revisa el modo de arranque (importante)</h2>
<p>Presiona <strong>Win + R</strong>, escribe <code>msinfo32</code> y mira <strong>Modo de BIOS</strong>.</p>
<ul>
<li><strong>UEFI:</strong> puedes seguir.</li>
<li><strong>Heredado (Legacy):</strong> <strong>detente acá.</strong> Desactivar el CSM en este caso hace que Windows no arranque. Convertir el disco a GPT es posible, pero es un procedimiento aparte que no vale el riesgo solo por este ajuste.</li>
</ul>
<h2>3. Actívalo en la BIOS</h2>
<p>Son dos opciones: <strong>Above 4G Decoding</strong> (activado) y <strong>Re-Size BAR Support</strong> (activado o Auto). El <strong>CSM</strong> tiene que estar desactivado. Dónde suele estar:</p>
<ul>
<li><strong>ASUS:</strong> Advanced › PCI Subsystem Settings. CSM en Boot › CSM.</li>
<li><strong>MSI:</strong> Settings › Advanced › PCI Subsystem Settings. CSM en Settings › Advanced › Windows OS Configuration (elige UEFI).</li>
<li><strong>Gigabyte:</strong> Settings › IO Ports. CSM en Boot › CSM Support.</li>
<li><strong>ASRock:</strong> Advanced › Chipset Configuration (a veces como C.A.M., Clever Access Memory). CSM en Boot › CSM.</li>
</ul>
<p>Muchas BIOS nuevas tienen un botón único de Resizable BAR en la pantalla inicial. Guarda con <strong>F10</strong>.</p>
<h2>4. Confirma</h2>
<p>De vuelta en Windows, repite el paso 1. Si sigue desactivado, actualiza la BIOS de la placa madre desde el sitio del fabricante y, en tarjetas RTX 30 más antiguas, el firmware de la tarjeta gráfica.</p>
""",
  },
  "en": {
    "title": "Resizable BAR (Smart Access Memory): what it is and how to enable it",
    "desc": "How to check and enable Resizable BAR (ReBAR) and AMD Smart Access Memory in the BIOS, the CSM and UEFI caveat, and the real gain in CS2.",
    "h1": "Resizable BAR: what it is and <em>how to enable it</em>",
    "lead": "Resizable BAR lets the processor access all of the graphics card's memory at once. AMD calls it Smart Access Memory (SAM). It's worth turning on, with one important caveat.",
    "card": "How to check it, enable it safely and the real gain.",
    "body": """
<h2>Real gain in CS2</h2>
<p>Keep expectations honest: in CS2 the gain is usually small. On NVIDIA cards the driver only uses it in games NVIDIA has enabled. Still, it's worth turning on, because it helps other games and doesn't hurt.</p>
<h2>What you need</h2>
<ul>
<li><strong>Graphics card:</strong> NVIDIA RTX 30 or newer, AMD Radeon RX 6000 or newer, or Intel Arc.</li>
<li><strong>Processor and motherboard:</strong> generally Intel 10th gen or newer and AMD Ryzen 3000/5000 or newer (except some models with integrated graphics), with an updated BIOS.</li>
<li><strong>Windows installed in UEFI mode.</strong> This is the part that needs care.</li>
</ul>
<h2>1. Check whether it's already on</h2>
<ul>
<li><strong>NVIDIA:</strong> NVIDIA Control Panel › <strong>Help › System Information</strong> and look for <strong>Resizable BAR: Yes</strong>.</li>
<li><strong>AMD:</strong> open AMD Software: Adrenalin and look for <strong>Smart Access Memory</strong> (in the performance/tuning area in most versions).</li>
</ul>
<h2>2. Check the boot mode (important)</h2>
<p>Press <strong>Win + R</strong>, type <code>msinfo32</code> and look at <strong>BIOS Mode</strong>.</p>
<ul>
<li><strong>UEFI:</strong> go ahead.</li>
<li><strong>Legacy:</strong> <strong>stop here.</strong> Turning off CSM in this case makes Windows fail to boot. Converting the disk to GPT is possible, but it's a separate procedure that isn't worth the risk just for this setting.</li>
</ul>
<h2>3. Enable it in the BIOS</h2>
<p>There are two options: <strong>Above 4G Decoding</strong> (enabled) and <strong>Re-Size BAR Support</strong> (enabled or Auto). <strong>CSM</strong> must be disabled. Where they usually are:</p>
<ul>
<li><strong>ASUS:</strong> Advanced › PCI Subsystem Settings. CSM under Boot › CSM.</li>
<li><strong>MSI:</strong> Settings › Advanced › PCI Subsystem Settings. CSM under Settings › Advanced › Windows OS Configuration (choose UEFI).</li>
<li><strong>Gigabyte:</strong> Settings › IO Ports. CSM under Boot › CSM Support.</li>
<li><strong>ASRock:</strong> Advanced › Chipset Configuration (sometimes as C.A.M., Clever Access Memory). CSM under Boot › CSM.</li>
</ul>
<p>Many newer BIOS versions have a single Resizable BAR toggle on the home screen. Save with <strong>F10</strong>.</p>
<h2>4. Confirm</h2>
<p>Back in Windows, repeat step 1. If it's still off, update the motherboard BIOS from the maker's website and, on older RTX 30 cards, the graphics card firmware.</p>
""",
  },
},
# ─────────────────────────────── AUTOEXEC ───────────────────────────────
{
  "id": "autoexec",
  "slug": {"pt": "autoexec-cs2", "es": "autoexec-cs2", "en": "cs2-autoexec"},
  "related": ["launch", "fps"],
  "pt": {
    "title": "autoexec.cfg no CS2: onde fica, como criar e o que colocar",
    "desc": "Onde fica a pasta cfg do CS2, como criar o autoexec.cfg sem errar a extensão, como fazer ele rodar sempre e um modelo simples para começar.",
    "h1": "<em>autoexec.cfg</em> no CS2",
    "lead": "O autoexec é um arquivo de texto com comandos que o CS2 roda ao abrir. Serve para deixar suas configurações sempre iguais, mesmo depois de atualização ou troca de PC.",
    "card": "Onde fica, como criar e um modelo para começar.",
    "body": """
<h2>Onde fica</h2>
<p>Na pasta do jogo, dentro de <code>game\\csgo\\cfg</code>. No caminho padrão da Steam:</p>
<p><code>C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg</code></p>
<p>O CS2 ainda usa a pasta com o nome "Counter-Strike Global Offensive". Se a sua biblioteca da Steam está em outro disco, o caminho começa nela. Atalho: na Steam, botão direito no CS2 › <strong>Gerenciar › Ver arquivos locais</strong>.</p>
<h2>Como criar sem errar</h2>
<ol>
<li>No Explorador de Arquivos, ative <strong>Exibir › Mostrar › Extensões de nomes de arquivos</strong>.</li>
<li>Na pasta <code>cfg</code>, crie um documento de texto e renomeie para <code>autoexec.cfg</code>. Ele não pode terminar em <code>.cfg.txt</code>, que é o erro mais comum.</li>
<li>Abra com o Bloco de Notas, cole os comandos e salve.</li>
</ol>
<p>O CSBoost cria e edita esse arquivo na página <strong>Counter-Strike 2</strong>, já no lugar certo.</p>
<h2>Fazer ele rodar sempre</h2>
<p>Para garantir que o CS2 carregue o arquivo toda vez, coloque <code>+exec autoexec</code> nas opções de inicialização. Veja {{g:launch}}.</p>
<h2>Um modelo para começar</h2>
<pre><code>// autoexec.cfg
fps_max "0"
cl_hud_telemetry_frametime_show "1"
cl_hud_telemetry_ping_show "1"
echo "autoexec carregado"</code></pre>
<ul>
<li><code>fps_max "0"</code>: sem limite de FPS. Se o seu PC esquenta ou oscila muito, um limite um pouco acima da média (por exemplo, 400) pode deixar o jogo mais estável.</li>
<li><code>cl_hud_telemetry_...</code>: mostra FPS e ping na tela.</li>
<li><code>echo</code>: escreve a frase no console. Se ela aparecer, o arquivo rodou.</li>
</ul>
<p>Mira, sensibilidade e viewmodel também podem ir aqui. Na página <strong>Configs de pros</strong> do CSBoost dá para copiar os comandos de 30 jogadores.</p>
<h2>Não funcionou?</h2>
<ul>
<li>Abra o console (tecla <code>'</code> ou <code>~</code>, precisa de <code>-console</code> nas opções) e digite <code>exec autoexec</code>. Se aparecer erro, o nome ou a pasta estão errados.</li>
<li>Confira a extensão <code>.cfg.txt</code>.</li>
</ul>
""",
  },
  "es": {
    "title": "autoexec.cfg en CS2: dónde está, cómo crearlo y qué poner",
    "desc": "Dónde está la carpeta cfg de CS2, cómo crear el autoexec.cfg sin equivocarte con la extensión, cómo hacer que se ejecute siempre y un modelo simple.",
    "h1": "<em>autoexec.cfg</em> en CS2",
    "lead": "El autoexec es un archivo de texto con comandos que CS2 ejecuta al abrir. Sirve para que tu configuración quede siempre igual, incluso después de una actualización o de cambiar de PC.",
    "card": "Dónde está, cómo crearlo y un modelo para empezar.",
    "body": """
<h2>Dónde está</h2>
<p>En la carpeta del juego, dentro de <code>game\\csgo\\cfg</code>. En la ruta estándar de Steam:</p>
<p><code>C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg</code></p>
<p>CS2 todavía usa la carpeta con el nombre "Counter-Strike Global Offensive". Si tu biblioteca de Steam está en otro disco, la ruta empieza ahí. Atajo: en Steam, clic derecho en CS2 › <strong>Administrar › Ver archivos locales</strong>.</p>
<h2>Cómo crearlo sin errores</h2>
<ol>
<li>En el Explorador de archivos, activa <strong>Vista › Mostrar › Extensiones de nombre de archivo</strong>.</li>
<li>En la carpeta <code>cfg</code>, crea un documento de texto y renómbralo a <code>autoexec.cfg</code>. No puede terminar en <code>.cfg.txt</code>, que es el error más común.</li>
<li>Ábrelo con el Bloc de notas, pega los comandos y guarda.</li>
</ol>
<p>CSBoost crea y edita este archivo en la página <strong>Counter-Strike 2</strong>, ya en el lugar correcto.</p>
<h2>Que se ejecute siempre</h2>
<p>Para asegurarte de que CS2 cargue el archivo cada vez, pon <code>+exec autoexec</code> en las opciones de lanzamiento. Mira {{g:launch}}.</p>
<h2>Un modelo para empezar</h2>
<pre><code>// autoexec.cfg
fps_max "0"
cl_hud_telemetry_frametime_show "1"
cl_hud_telemetry_ping_show "1"
echo "autoexec cargado"</code></pre>
<ul>
<li><code>fps_max "0"</code>: sin límite de FPS. Si tu PC se calienta o los FPS oscilan mucho, un límite un poco arriba del promedio (por ejemplo, 400) puede dejar el juego más estable.</li>
<li><code>cl_hud_telemetry_...</code>: muestra FPS y ping en pantalla.</li>
<li><code>echo</code>: escribe la frase en la consola. Si aparece, el archivo se ejecutó.</li>
</ul>
<p>Mira, sensibilidad y viewmodel también pueden ir aquí. En la página <strong>Configs de pros</strong> de CSBoost puedes copiar los comandos de 30 jugadores.</p>
<h2>¿No funcionó?</h2>
<ul>
<li>Abre la consola (tecla <code>'</code> o <code>~</code>, necesita <code>-console</code> en las opciones) y escribe <code>exec autoexec</code>. Si aparece un error, el nombre o la carpeta están mal.</li>
<li>Revisa la extensión <code>.cfg.txt</code>.</li>
</ul>
""",
  },
  "en": {
    "title": "CS2 autoexec.cfg: where it goes, how to create it and what to put in it",
    "desc": "Where CS2's cfg folder is, how to create autoexec.cfg without the wrong extension, how to make it run every time and a simple starter template.",
    "h1": "CS2 <em>autoexec.cfg</em>",
    "lead": "The autoexec is a text file with commands CS2 runs when it opens. It keeps your settings the same, even after an update or a new PC.",
    "card": "Where it goes, how to create it and a starter template.",
    "body": """
<h2>Where it goes</h2>
<p>In the game folder, inside <code>game\\csgo\\cfg</code>. On the default Steam path:</p>
<p><code>C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\game\\csgo\\cfg</code></p>
<p>CS2 still uses the folder named "Counter-Strike Global Offensive". If your Steam library is on another drive, the path starts there. Shortcut: in Steam, right-click CS2 › <strong>Manage › Browse local files</strong>.</p>
<h2>How to create it without mistakes</h2>
<ol>
<li>In File Explorer, turn on <strong>View › Show › File name extensions</strong>.</li>
<li>In the <code>cfg</code> folder, create a text document and rename it to <code>autoexec.cfg</code>. It must not end in <code>.cfg.txt</code>, which is the most common mistake.</li>
<li>Open it in Notepad, paste the commands and save.</li>
</ol>
<p>CSBoost creates and edits this file on its <strong>Counter-Strike 2</strong> page, already in the right place.</p>
<h2>Make it run every time</h2>
<p>To make sure CS2 loads the file every time, add <code>+exec autoexec</code> to the launch options. See {{g:launch}}.</p>
<h2>A starter template</h2>
<pre><code>// autoexec.cfg
fps_max "0"
cl_hud_telemetry_frametime_show "1"
cl_hud_telemetry_ping_show "1"
echo "autoexec loaded"</code></pre>
<ul>
<li><code>fps_max "0"</code>: no FPS cap. If your PC runs hot or FPS swings a lot, a cap a bit above your average (for example, 400) can make the game steadier.</li>
<li><code>cl_hud_telemetry_...</code>: shows FPS and ping on screen.</li>
<li><code>echo</code>: prints the line in the console. If it shows up, the file ran.</li>
</ul>
<p>Crosshair, sensitivity and viewmodel can go here too. CSBoost's <strong>Pro configs</strong> page lets you copy the commands of 30 players.</p>
<h2>Didn't work?</h2>
<ul>
<li>Open the console (the <code>'</code> or <code>~</code> key, which needs <code>-console</code> in the launch options) and type <code>exec autoexec</code>. If you get an error, the name or folder is wrong.</li>
<li>Check for the <code>.cfg.txt</code> extension.</li>
</ul>
""",
  },
},
# ─────────────────────────────── OPÇÕES DE INICIALIZAÇÃO ───────────────────────────────
{
  "id": "launch",
  "slug": {"pt": "opcoes-de-inicializacao-cs2", "es": "opciones-de-lanzamiento-cs2", "en": "cs2-launch-options"},
  "related": ["autoexec", "fps"],
  "pt": {
    "title": "Opções de inicialização do CS2: quais usar e quais evitar",
    "desc": "As opções de inicialização que valem no CS2, as antigas do CS:GO que não fazem mais nada e a que você nunca deve usar.",
    "h1": "Opções de inicialização do <em>CS2</em>",
    "lead": "Muita lista na internet ainda é do CS:GO. No CS2, quase nenhuma opção antiga muda o FPS, e uma delas pode até atrapalhar.",
    "card": "O que vale, o que não faz nada e o que evitar.",
    "body": """
<h2>Onde colocar</h2>
<p>Na Steam: botão direito no <strong>Counter-Strike 2 › Propriedades › Geral › Opções de inicialização</strong>. Separe as opções com espaço.</p>
<h2>O que recomendamos</h2>
<p><code>-console +exec autoexec</code></p>
<ul>
<li><code>-console</code>: libera o console desde o início.</li>
<li><code>+exec autoexec</code>: roda o seu {{g:autoexec}} toda vez que o jogo abre.</li>
</ul>
<p>É só isso. O ganho de desempenho vem de outros lugares (veja {{g:fps}}).</p>
<h2>Opções antigas que não precisa mais</h2>
<ul>
<li><code>-novid</code>: o CS2 não tem vídeo de abertura.</li>
<li><code>-tickrate 128</code>: o CS2 usa o sistema de subtick, essa opção não muda nada no matchmaking.</li>
<li><code>-threads</code> e <code>-high</code>: o jogo e o Windows já distribuem o trabalho. Forçar pode piorar ou causar travadas.</li>
<li>Opções de memória e de rede antigas do CS:GO (como <code>-nod3d9ex</code> ou <code>+rate</code> sem saber o que faz): no melhor caso não fazem nada.</li>
</ul>
<h2>Use só se precisar</h2>
<ul>
<li><code>-fullscreen</code>, <code>-w</code> e <code>-h</code>: forçam tela cheia e resolução, úteis se o jogo abrir errado. O normal é ajustar no menu de vídeo.</li>
<li><code>+fps_max</code>: mesmo efeito do comando no autoexec.</li>
</ul>
<h2>Nunca use</h2>
<p><code>-allow_third_party_software</code> desliga o <strong>Modo Confiável</strong> do CS2. Isso diminui o seu fator de confiança e só serve para programas que mexem no jogo. O CSBoost nunca pede essa opção.</p>
""",
  },
  "es": {
    "title": "Opciones de lanzamiento de CS2: cuáles usar y cuáles evitar",
    "desc": "Las opciones de lanzamiento que sirven en CS2, las viejas de CS:GO que ya no hacen nada y la que nunca debes usar.",
    "h1": "Opciones de lanzamiento de <em>CS2</em>",
    "lead": "Muchas listas en internet todavía son de CS:GO. En CS2, casi ninguna opción vieja cambia los FPS, y una de ellas hasta puede perjudicarte.",
    "card": "Lo que sirve, lo que no hace nada y lo que hay que evitar.",
    "body": """
<h2>Dónde ponerlas</h2>
<p>En Steam: clic derecho en <strong>Counter-Strike 2 › Propiedades › General › Opciones de lanzamiento</strong>. Sepáralas con un espacio.</p>
<h2>Lo que recomendamos</h2>
<p><code>-console +exec autoexec</code></p>
<ul>
<li><code>-console</code>: habilita la consola desde el inicio.</li>
<li><code>+exec autoexec</code>: ejecuta tu {{g:autoexec}} cada vez que abre el juego.</li>
</ul>
<p>Nada más. La mejora de rendimiento viene de otros lados (mira {{g:fps}}).</p>
<h2>Opciones viejas que ya no hacen falta</h2>
<ul>
<li><code>-novid</code>: CS2 no tiene video de inicio.</li>
<li><code>-tickrate 128</code>: CS2 usa el sistema de subtick, esta opción no cambia nada en matchmaking.</li>
<li><code>-threads</code> y <code>-high</code>: el juego y Windows ya reparten el trabajo. Forzarlo puede empeorar o causar tirones.</li>
<li>Opciones viejas de memoria y de red de CS:GO (como <code>-nod3d9ex</code> o <code>+rate</code> sin saber qué hace): en el mejor caso no hacen nada.</li>
</ul>
<h2>Úsalas solo si hace falta</h2>
<ul>
<li><code>-fullscreen</code>, <code>-w</code> y <code>-h</code>: fuerzan pantalla completa y resolución, útiles si el juego abre mal. Lo normal es ajustarlo en el menú de video.</li>
<li><code>+fps_max</code>: mismo efecto que el comando en el autoexec.</li>
</ul>
<h2>Nunca uses</h2>
<p><code>-allow_third_party_software</code> desactiva el <strong>Modo de confianza</strong> de CS2. Eso baja tu factor de confianza y solo sirve para programas que tocan el juego. CSBoost nunca pide esta opción.</p>
""",
  },
  "en": {
    "title": "CS2 launch options: which to use and which to avoid",
    "desc": "The launch options that matter in CS2, the old CS:GO ones that no longer do anything and the one you should never use.",
    "h1": "<em>CS2</em> launch options",
    "lead": "Many lists online are still from CS:GO. In CS2, almost no old option changes FPS, and one of them can even hurt you.",
    "card": "What works, what does nothing and what to avoid.",
    "body": """
<h2>Where to put them</h2>
<p>In Steam: right-click <strong>Counter-Strike 2 › Properties › General › Launch Options</strong>. Separate options with a space.</p>
<h2>What we recommend</h2>
<p><code>-console +exec autoexec</code></p>
<ul>
<li><code>-console</code>: enables the console from the start.</li>
<li><code>+exec autoexec</code>: runs your {{g:autoexec}} every time the game opens.</li>
</ul>
<p>That's it. Performance gains come from elsewhere (see {{g:fps}}).</p>
<h2>Old options you no longer need</h2>
<ul>
<li><code>-novid</code>: CS2 has no intro video.</li>
<li><code>-tickrate 128</code>: CS2 uses the subtick system; this option changes nothing in matchmaking.</li>
<li><code>-threads</code> and <code>-high</code>: the game and Windows already spread the work. Forcing it can make things worse or cause stutter.</li>
<li>Old CS:GO memory and network options (like <code>-nod3d9ex</code>, or <code>+rate</code> without knowing what it does): at best they do nothing.</li>
</ul>
<h2>Use only if you need them</h2>
<ul>
<li><code>-fullscreen</code>, <code>-w</code> and <code>-h</code>: force fullscreen and resolution, useful if the game opens wrong. Normally you set this in the video menu.</li>
<li><code>+fps_max</code>: same effect as the command in the autoexec.</li>
</ul>
<h2>Never use</h2>
<p><code>-allow_third_party_software</code> turns off CS2's <strong>Trusted Mode</strong>. That lowers your trust factor and only exists for programs that hook into the game. CSBoost never asks for this option.</p>
""",
  },
},
# ─────────────────────────────── PLACA INTEGRADA ───────────────────────────────
{
  "id": "integrada",
  "slug": {"pt": "cs2-placa-integrada", "es": "cs2-grafica-integrada", "en": "cs2-integrated-gpu"},
  "related": ["driver", "fps"],
  "pt": {
    "title": "CS2 rodando na placa integrada: como usar a placa de vídeo dedicada",
    "desc": "Como saber se o CS2 está usando o vídeo integrado e como forçar a placa dedicada no notebook e no PC de mesa: Windows, NVIDIA, cabo do monitor e MUX switch.",
    "h1": "CS2 na <em>placa integrada</em>",
    "lead": "Em notebook gamer e em PC com duas placas, o CS2 às vezes roda no vídeo do processador e perde metade do FPS. Dá para resolver em poucos minutos.",
    "card": "Notebook e PC de mesa: como forçar a placa dedicada.",
    "body": """
<h2>Como saber</h2>
<ul>
<li>No CSBoost: abra o CS2, vá na página <strong>Counter-Strike 2</strong> do app e clique em <strong>Verificar</strong> no card <strong>Placa de vídeo do CS2</strong>.</li>
<li>Sem o app: com o jogo aberto, abra o Gerenciador de Tarefas, aba <strong>Processos</strong>, e veja a coluna <strong>Mecanismo da GPU</strong> do CS2 (GPU 0 ou GPU 1).</li>
</ul>
<h2>PC de mesa: o cabo do monitor</h2>
<p>Se o cabo está na saída de vídeo da placa-mãe (vertical, perto das USB), a imagem passa pelo vídeo integrado. Desligue o PC e coloque o cabo na saída da placa de vídeo (mais embaixo, na horizontal).</p>
<h2>Notebook: diga ao Windows qual placa usar</h2>
<ol>
<li><strong>Configurações › Sistema › Tela › Elementos gráficos</strong> (no Windows 10: Configurações de gráficos).</li>
<li>Adicione o <code>cs2.exe</code>, que fica em <code>...\\Counter-Strike Global Offensive\\game\\bin\\win64\\</code>.</li>
<li>Em <strong>Opções</strong>, escolha <strong>Alto desempenho</strong> e salve.</li>
</ol>
<p>O CSBoost faz isso com o ajuste <strong>CS2 sempre na placa de vídeo dedicada</strong>, no Raio-X ou em Otimizações.</p>
<h2>Notebook com placa NVIDIA</h2>
<p>No Painel de Controle da NVIDIA: <strong>Gerenciar as configurações 3D › Configurações de programa</strong>, escolha o Counter-Strike 2 e, em <strong>Processador gráfico preferido</strong>, selecione o processador NVIDIA de alto desempenho.</p>
<h2>MUX switch: o ajuste que mais rende</h2>
<p>Vários notebooks gamer têm um modo em que a imagem sai direto da placa dedicada, sem passar pelo vídeo integrado. Costuma dar ganho grande. Pede reiniciar e gasta mais bateria.</p>
<ul>
<li><strong>Acer:</strong> NitroSense ou PredatorSense.</li>
<li><strong>ASUS:</strong> Armoury Crate, modo de GPU Ultimate/MUX.</li>
<li><strong>Lenovo:</strong> Legion Space/Vantage, desligar o modo híbrido.</li>
<li><strong>MSI:</strong> MSI Center, modo de placa dedicada.</li>
</ul>
<h2>Sempre na tomada</h2>
<p>Na bateria, o notebook limita a placa de vídeo. Para jogar, ligue o carregador.</p>
""",
  },
  "es": {
    "title": "CS2 en la gráfica integrada: cómo usar la tarjeta gráfica dedicada",
    "desc": "Cómo saber si CS2 usa el video integrado y cómo forzar la tarjeta dedicada en notebook y PC de escritorio: Windows, NVIDIA, cable del monitor y MUX switch.",
    "h1": "CS2 en la <em>gráfica integrada</em>",
    "lead": "En notebooks gamer y PCs con dos tarjetas, CS2 a veces corre en el video del procesador y pierde la mitad de los FPS. Se resuelve en pocos minutos.",
    "card": "Notebook y PC de escritorio: cómo forzar la tarjeta dedicada.",
    "body": """
<h2>Cómo saberlo</h2>
<ul>
<li>En CSBoost: abre CS2, ve a la página <strong>Counter-Strike 2</strong> de la app y haz clic en <strong>Comprobar</strong> en la tarjeta <strong>Placa de video de CS2</strong>.</li>
<li>Sin la app: con el juego abierto, abre el Administrador de tareas, pestaña <strong>Procesos</strong>, y mira la columna <strong>Motor de GPU</strong> de CS2 (GPU 0 o GPU 1).</li>
</ul>
<h2>PC de escritorio: el cable del monitor</h2>
<p>Si el cable está en la salida de video de la placa madre (vertical, cerca de los USB), la imagen pasa por el video integrado. Apaga la PC y conecta el cable en la salida de la tarjeta gráfica (más abajo, en horizontal).</p>
<h2>Notebook: dile a Windows qué tarjeta usar</h2>
<ol>
<li><strong>Configuración › Sistema › Pantalla › Gráficos</strong> (en Windows 10: Configuración de gráficos).</li>
<li>Agrega el <code>cs2.exe</code>, que está en <code>...\\Counter-Strike Global Offensive\\game\\bin\\win64\\</code>.</li>
<li>En <strong>Opciones</strong>, elige <strong>Alto rendimiento</strong> y guarda.</li>
</ol>
<p>CSBoost hace esto con el ajuste <strong>CS2 siempre en la placa de video dedicada</strong>, en Rayos X o en Optimizaciones.</p>
<h2>Notebook con tarjeta NVIDIA</h2>
<p>En el Panel de control de NVIDIA: <strong>Administrar la configuración 3D › Configuración de programa</strong>, elige Counter-Strike 2 y, en <strong>Procesador de gráficos preferido</strong>, selecciona el procesador NVIDIA de alto rendimiento.</p>
<h2>MUX switch: el ajuste que más rinde</h2>
<p>Varias notebooks gamer tienen un modo en el que la imagen sale directo de la tarjeta dedicada, sin pasar por el video integrado. Suele dar una mejora grande. Requiere reiniciar y gasta más batería.</p>
<ul>
<li><strong>Acer:</strong> NitroSense o PredatorSense.</li>
<li><strong>ASUS:</strong> Armoury Crate, modo de GPU Ultimate/MUX.</li>
<li><strong>Lenovo:</strong> Legion Space/Vantage, desactivar el modo híbrido.</li>
<li><strong>MSI:</strong> MSI Center, modo de gráfica dedicada.</li>
</ul>
<h2>Siempre enchufada</h2>
<p>Con batería, la notebook limita la tarjeta gráfica. Para jugar, conecta el cargador.</p>
""",
  },
  "en": {
    "title": "CS2 running on integrated graphics: how to use the dedicated GPU",
    "desc": "How to tell if CS2 is using the integrated graphics and how to force the dedicated GPU on laptops and desktops: Windows, NVIDIA, monitor cable and MUX switch.",
    "h1": "CS2 on <em>integrated graphics</em>",
    "lead": "On gaming laptops and PCs with two GPUs, CS2 sometimes runs on the processor's graphics and loses half its FPS. It takes a few minutes to fix.",
    "card": "Laptop and desktop: how to force the dedicated GPU.",
    "body": """
<h2>How to tell</h2>
<ul>
<li>In CSBoost: open CS2, go to the app's <strong>Counter-Strike 2</strong> page and click <strong>Check</strong> on the <strong>CS2 graphics card</strong> card.</li>
<li>Without the app: with the game open, open Task Manager, <strong>Processes</strong> tab, and look at CS2's <strong>GPU engine</strong> column (GPU 0 or GPU 1).</li>
</ul>
<h2>Desktop: the monitor cable</h2>
<p>If the cable is in the motherboard's video port (vertical, next to the USB ports), the image goes through the integrated graphics. Turn off the PC and plug the cable into the graphics card's port (lower down, horizontal).</p>
<h2>Laptop: tell Windows which GPU to use</h2>
<ol>
<li><strong>Settings › System › Display › Graphics</strong> (on Windows 10: Graphics settings).</li>
<li>Add <code>cs2.exe</code>, located in <code>...\\Counter-Strike Global Offensive\\game\\bin\\win64\\</code>.</li>
<li>Under <strong>Options</strong>, choose <strong>High performance</strong> and save.</li>
</ol>
<p>CSBoost does this with the <strong>CS2 always on the dedicated graphics card</strong> tweak, in the PC Scan or in Optimizations.</p>
<h2>Laptop with an NVIDIA card</h2>
<p>In the NVIDIA Control Panel: <strong>Manage 3D settings › Program Settings</strong>, choose Counter-Strike 2 and, under <strong>Preferred graphics processor</strong>, select the high-performance NVIDIA processor.</p>
<h2>MUX switch: the biggest win</h2>
<p>Many gaming laptops have a mode where the image comes straight from the dedicated GPU, bypassing the integrated graphics. It usually gives a big gain. It needs a restart and uses more battery.</p>
<ul>
<li><strong>Acer:</strong> NitroSense or PredatorSense.</li>
<li><strong>ASUS:</strong> Armoury Crate, Ultimate/MUX GPU mode.</li>
<li><strong>Lenovo:</strong> Legion Space/Vantage, turn off hybrid mode.</li>
<li><strong>MSI:</strong> MSI Center, discrete graphics mode.</li>
</ul>
<h2>Always plugged in</h2>
<p>On battery, the laptop limits the graphics card. Plug in the charger to play.</p>
""",
  },
},
# ─────────────────────────────── DRIVER ───────────────────────────────
{
  "id": "driver",
  "slug": {"pt": "driver-de-video", "es": "driver-de-video", "en": "graphics-driver"},
  "related": ["amd", "integrada"],
  "pt": {
    "title": "Como atualizar o driver de vídeo (NVIDIA, AMD e Intel) para o CS2",
    "desc": "Como saber a versão do driver de vídeo e atualizar pelo app oficial da NVIDIA, AMD ou Intel, quando fazer instalação limpa e o que fazer se a placa estiver sem driver.",
    "h1": "Como atualizar o <em>driver de vídeo</em>",
    "lead": "O driver é o programa que faz o Windows conversar com a placa de vídeo. NVIDIA e AMD lançam versões com correções para jogos novos e populares, como o CS2.",
    "card": "Atualizar pela fonte oficial e o que fazer se der problema.",
    "body": """
<h2>Qual driver você tem</h2>
<p>O Raio-X do CSBoost mostra a data do driver e avisa quando ele está antigo. No Windows: <strong>Gerenciador de Dispositivos › Adaptadores de vídeo</strong>, clique duas vezes na placa e abra a aba <strong>Driver</strong>.</p>
<h2>Baixe só do site oficial</h2>
<ul>
<li><strong>NVIDIA:</strong> app NVIDIA ou <code>nvidia.com/drivers</code>. Escolha o driver <strong>Game Ready</strong>.</li>
<li><strong>AMD:</strong> AMD Software: Adrenalin Edition ou <code>amd.com/support</code>.</li>
<li><strong>Intel:</strong> Intel Graphics Software / Driver &amp; Support Assistant ou <code>intel.com/support</code>.</li>
</ul>
<p>Evite sites de "drivers grátis" e programas que prometem atualizar tudo: muitos trazem anúncios ou coisa pior.</p>
<h2>Notebook</h2>
<p>Na maioria dos notebooks, o driver do site da NVIDIA ou da AMD instala normalmente. Se o instalador disser que não é compatível, use o driver da página de suporte do fabricante do notebook.</p>
<h2>Depois de atualizar</h2>
<p>A primeira partida pode ter umas travadinhas: o CS2 está recriando o cache de shaders para o driver novo. Some depois de alguns minutos de jogo.</p>
<h2>Deu problema? Instalação limpa</h2>
<ul>
<li>No instalador da NVIDIA, escolha a instalação personalizada e marque a opção de <strong>instalação limpa</strong>.</li>
<li>No instalador da AMD, use a opção <strong>Redefinição de fábrica</strong>.</li>
<li>Se ainda assim der problema, existe o DDU (Display Driver Uninstaller), que remove tudo no Modo de Segurança. Use só se as opções acima não resolverem.</li>
</ul>
<h2>"Adaptador de Vídeo Básico da Microsoft"</h2>
<p>Se esse é o nome que aparece no Gerenciador de Dispositivos, a placa está sem driver e o desempenho fica péssimo. Instale o driver oficial do fabricante. Se acabou de formatar, o Windows Update às vezes demora para instalar sozinho.</p>
""",
  },
  "es": {
    "title": "Cómo actualizar el driver de video (NVIDIA, AMD e Intel) para CS2",
    "desc": "Cómo ver la versión del driver de video y actualizarlo con la app oficial de NVIDIA, AMD o Intel, cuándo hacer una instalación limpia y qué hacer si la tarjeta no tiene driver.",
    "h1": "Cómo actualizar el <em>driver de video</em>",
    "lead": "El driver es el programa que permite que Windows hable con la tarjeta gráfica. NVIDIA y AMD lanzan versiones con correcciones para juegos nuevos y populares, como CS2.",
    "card": "Actualizar desde la fuente oficial y qué hacer si falla.",
    "body": """
<h2>Qué driver tienes</h2>
<p>Rayos X de CSBoost muestra la fecha del driver y avisa cuando es viejo. En Windows: <strong>Administrador de dispositivos › Adaptadores de pantalla</strong>, haz doble clic en la tarjeta y abre la pestaña <strong>Controlador</strong>.</p>
<h2>Descarga solo del sitio oficial</h2>
<ul>
<li><strong>NVIDIA:</strong> app de NVIDIA o <code>nvidia.com/drivers</code>. Elige el driver <strong>Game Ready</strong>.</li>
<li><strong>AMD:</strong> AMD Software: Adrenalin Edition o <code>amd.com/support</code>.</li>
<li><strong>Intel:</strong> Intel Graphics Software / Driver &amp; Support Assistant o <code>intel.com/support</code>.</li>
</ul>
<p>Evita los sitios de "drivers gratis" y los programas que prometen actualizar todo: muchos traen anuncios o algo peor.</p>
<h2>Notebook</h2>
<p>En la mayoría de las notebooks, el driver del sitio de NVIDIA o AMD se instala normalmente. Si el instalador dice que no es compatible, usa el driver de la página de soporte del fabricante de la notebook.</p>
<h2>Después de actualizar</h2>
<p>La primera partida puede tener algunos tirones: CS2 está regenerando la caché de shaders para el driver nuevo. Desaparecen después de unos minutos de juego.</p>
<h2>¿Hubo problemas? Instalación limpia</h2>
<ul>
<li>En el instalador de NVIDIA, elige la instalación personalizada y marca la opción de <strong>instalación limpia</strong>.</li>
<li>En el instalador de AMD, usa la opción <strong>Restablecimiento de fábrica</strong>.</li>
<li>Si aun así falla, existe DDU (Display Driver Uninstaller), que borra todo en Modo seguro. Úsalo solo si lo anterior no lo resuelve.</li>
</ul>
<h2>"Adaptador de pantalla básico de Microsoft"</h2>
<p>Si ese es el nombre que aparece en el Administrador de dispositivos, la tarjeta no tiene driver y el rendimiento es pésimo. Instala el driver oficial del fabricante. Si acabas de formatear, Windows Update a veces tarda en instalarlo solo.</p>
""",
  },
  "en": {
    "title": "How to update your graphics driver (NVIDIA, AMD and Intel) for CS2",
    "desc": "How to check your graphics driver version and update it with NVIDIA, AMD or Intel's official app, when to do a clean install and what to do if the card has no driver.",
    "h1": "How to update your <em>graphics driver</em>",
    "lead": "The driver is what lets Windows talk to your graphics card. NVIDIA and AMD release versions with fixes for new and popular games, like CS2.",
    "card": "Update from the official source and what to do if it goes wrong.",
    "body": """
<h2>Which driver you have</h2>
<p>CSBoost's PC Scan shows the driver date and warns when it's old. In Windows: <strong>Device Manager › Display adapters</strong>, double-click the card and open the <strong>Driver</strong> tab.</p>
<h2>Download only from the official site</h2>
<ul>
<li><strong>NVIDIA:</strong> the NVIDIA app or <code>nvidia.com/drivers</code>. Choose the <strong>Game Ready</strong> driver.</li>
<li><strong>AMD:</strong> AMD Software: Adrenalin Edition or <code>amd.com/support</code>.</li>
<li><strong>Intel:</strong> Intel Graphics Software / Driver &amp; Support Assistant or <code>intel.com/support</code>.</li>
</ul>
<p>Avoid "free driver" sites and programs that promise to update everything: many come with ads or worse.</p>
<h2>Laptops</h2>
<p>On most laptops, the driver from NVIDIA's or AMD's site installs normally. If the installer says it isn't compatible, use the driver from the laptop maker's support page.</p>
<h2>After updating</h2>
<p>The first match may stutter a bit: CS2 is rebuilding its shader cache for the new driver. It goes away after a few minutes of play.</p>
<h2>Something broke? Clean install</h2>
<ul>
<li>In NVIDIA's installer, choose custom installation and tick <strong>clean installation</strong>.</li>
<li>In AMD's installer, use the <strong>Factory Reset</strong> option.</li>
<li>If it still fails, there's DDU (Display Driver Uninstaller), which removes everything in Safe Mode. Use it only if the options above don't fix it.</li>
</ul>
<h2>"Microsoft Basic Display Adapter"</h2>
<p>If that's the name in Device Manager, the card has no driver and performance is terrible. Install the official driver from the maker. If you just reinstalled Windows, Windows Update sometimes takes a while to install it on its own.</p>
""",
  },
},
# ─────────────────────────────── AMD ADRENALIN ───────────────────────────────
{
  "id": "amd",
  "slug": {"pt": "amd-adrenalin-cs2", "es": "amd-adrenalin-cs2", "en": "amd-adrenalin-cs2"},
  "related": ["driver", "resizable-bar"],
  "pt": {
    "title": "AMD Adrenalin para CS2: o que ligar, o que desligar e o que evitar",
    "desc": "Configurações do AMD Software: Adrenalin para o CS2 com segurança: o que desligar para ter menos atraso, por que evitar o Anti-Lag pelo driver e o perfil eSports.",
    "h1": "AMD Adrenalin para <em>CS2</em>",
    "lead": "Guia para placas Radeon. O CSBoost não grava nada no driver da AMD: aqui é só orientação, para você ajustar no AMD Software com segurança.",
    "card": "Ajustes seguros para placas Radeon, sem risco de VAC.",
    "body": """
<h2>Primeiro: o cuidado com o VAC</h2>
<p>Em outubro de 2023, jogadores de CS2 com placa AMD levaram VAC ban por causa do <strong>Anti-Lag+</strong>, um recurso do driver que atuava dentro do processo do jogo. A Valve reverteu os bans depois, mas fica a lição: <strong>não ligue recursos do driver que atuam dentro do jogo</strong> só porque prometem menos atraso. Se o próprio CS2 oferecer uma opção de baixa latência no menu de vídeo, use a do jogo.</p>
<h2>Onde ajustar</h2>
<p>Abra o <strong>AMD Software: Adrenalin Edition › Jogos</strong> e escolha o <strong>Counter-Strike 2</strong> para ajustar só nele. Se o jogo não aparecer, abra e feche o CS2 uma vez ou adicione o <code>cs2.exe</code> manualmente.</p>
<h2>Não use o perfil "eSports"</h2>
<p>O perfil pronto "eSports" liga recursos como o Radeon Anti-Lag e o Radeon Boost. Prefira <strong>Personalizado</strong> e ajuste item por item.</p>
<h2>Recomendado para o CS2</h2>
<ul>
<li><strong>Radeon Anti-Lag:</strong> desligado (pelo motivo acima).</li>
<li><strong>Radeon Boost:</strong> desligado. Ele baixa a resolução quando você mexe a mira, justamente na hora da troca.</li>
<li><strong>Radeon Chill:</strong> desligado. Limita o FPS quando há pouco movimento.</li>
<li><strong>AMD Fluid Motion Frames (AFMF):</strong> desligado. Gera quadros extras, mas aumenta o atraso, o que é ruim em jogo competitivo.</li>
<li><strong>Radeon Super Resolution:</strong> desligado.</li>
<li><strong>Radeon Image Sharpening:</strong> desligado. Se quiser mais nitidez, use as opções do próprio jogo.</li>
<li><strong>Enhanced Sync:</strong> desligado.</li>
<li><strong>Aguardar atualização vertical:</strong> "Desligado, a menos que o aplicativo especifique", e V-Sync desligado no jogo.</li>
<li><strong>Frame Rate Target Control:</strong> desligado. Se quiser limitar o FPS, use <code>fps_max</code> no {{g:autoexec}}.</li>
<li><strong>Gravação instantânea / Replay:</strong> desligada, se não usa. Gravar o tempo todo custa desempenho.</li>
</ul>
<h2>Pode ligar</h2>
<ul>
<li><strong>Smart Access Memory</strong> (o Resizable BAR da AMD), se o seu PC suporta. Veja {{g:resizable-bar}}.</li>
</ul>
<h2>Driver em dia</h2>
<p>Atualize pelo próprio Adrenalin. Veja {{g:driver}}.</p>
""",
  },
  "es": {
    "title": "AMD Adrenalin para CS2: qué activar, qué desactivar y qué evitar",
    "desc": "Opciones de AMD Software: Adrenalin para CS2 con seguridad: qué desactivar para tener menos retraso, por qué evitar el Anti-Lag desde el driver y el perfil eSports.",
    "h1": "AMD Adrenalin para <em>CS2</em>",
    "lead": "Guía para tarjetas Radeon. CSBoost no graba nada en el driver de AMD: esto es solo orientación, para que ajustes AMD Software con seguridad.",
    "card": "Ajustes seguros para tarjetas Radeon, sin riesgo de VAC.",
    "body": """
<h2>Primero: el cuidado con el VAC</h2>
<p>En octubre de 2023, jugadores de CS2 con tarjeta AMD recibieron VAC ban por el <strong>Anti-Lag+</strong>, una función del driver que actuaba dentro del proceso del juego. Valve revirtió los bans después, pero queda la lección: <strong>no actives funciones del driver que actúan dentro del juego</strong> solo porque prometen menos retraso. Si el propio CS2 ofrece una opción de baja latencia en el menú de video, usa la del juego.</p>
<h2>Dónde ajustar</h2>
<p>Abre <strong>AMD Software: Adrenalin Edition › Juegos</strong> y elige <strong>Counter-Strike 2</strong> para ajustar solo ese juego. Si no aparece, abre y cierra CS2 una vez o agrega el <code>cs2.exe</code> a mano.</p>
<h2>No uses el perfil "eSports"</h2>
<p>El perfil listo "eSports" activa funciones como Radeon Anti-Lag y Radeon Boost. Elige <strong>Personalizado</strong> y ajusta punto por punto.</p>
<h2>Recomendado para CS2</h2>
<ul>
<li><strong>Radeon Anti-Lag:</strong> desactivado (por el motivo de arriba).</li>
<li><strong>Radeon Boost:</strong> desactivado. Baja la resolución cuando mueves la mira, justo en el momento del duelo.</li>
<li><strong>Radeon Chill:</strong> desactivado. Limita los FPS cuando hay poco movimiento.</li>
<li><strong>AMD Fluid Motion Frames (AFMF):</strong> desactivado. Genera cuadros extra, pero aumenta el retraso, lo que es malo en un juego competitivo.</li>
<li><strong>Radeon Super Resolution:</strong> desactivado.</li>
<li><strong>Radeon Image Sharpening:</strong> desactivado. Si quieres más nitidez, usa las opciones del propio juego.</li>
<li><strong>Enhanced Sync:</strong> desactivado.</li>
<li><strong>Esperar la actualización vertical:</strong> "Desactivado, a menos que lo especifique la aplicación", y V-Sync desactivado en el juego.</li>
<li><strong>Frame Rate Target Control:</strong> desactivado. Si quieres limitar los FPS, usa <code>fps_max</code> en el {{g:autoexec}}.</li>
<li><strong>Grabación instantánea / Replay:</strong> desactivada, si no la usas. Grabar todo el tiempo cuesta rendimiento.</li>
</ul>
<h2>Puedes activar</h2>
<ul>
<li><strong>Smart Access Memory</strong> (el Resizable BAR de AMD), si tu PC lo soporta. Mira {{g:resizable-bar}}.</li>
</ul>
<h2>Driver al día</h2>
<p>Actualiza desde el mismo Adrenalin. Mira {{g:driver}}.</p>
""",
  },
  "en": {
    "title": "AMD Adrenalin for CS2: what to turn on, off and avoid",
    "desc": "Safe AMD Software: Adrenalin settings for CS2: what to turn off for less latency, why to avoid driver Anti-Lag and the eSports profile.",
    "h1": "AMD Adrenalin for <em>CS2</em>",
    "lead": "A guide for Radeon cards. CSBoost doesn't write anything to AMD's driver: this is guidance only, so you can tune AMD Software safely.",
    "card": "Safe settings for Radeon cards, with no VAC risk.",
    "body": """
<h2>First: the VAC caveat</h2>
<p>In October 2023, CS2 players with AMD cards got VAC banned because of <strong>Anti-Lag+</strong>, a driver feature that worked inside the game process. Valve later reversed the bans, but the lesson stands: <strong>don't turn on driver features that work inside the game</strong> just because they promise less latency. If CS2 itself offers a low-latency option in its video menu, use the game's.</p>
<h2>Where to change it</h2>
<p>Open <strong>AMD Software: Adrenalin Edition › Gaming</strong> and pick <strong>Counter-Strike 2</strong> to change settings for that game only. If it isn't listed, open and close CS2 once or add <code>cs2.exe</code> manually.</p>
<h2>Don't use the "eSports" profile</h2>
<p>The ready-made "eSports" profile turns on features like Radeon Anti-Lag and Radeon Boost. Choose <strong>Custom</strong> and set each item yourself.</p>
<h2>Recommended for CS2</h2>
<ul>
<li><strong>Radeon Anti-Lag:</strong> off (for the reason above).</li>
<li><strong>Radeon Boost:</strong> off. It lowers resolution when you move your aim, right when the duel happens.</li>
<li><strong>Radeon Chill:</strong> off. It caps FPS when there's little movement.</li>
<li><strong>AMD Fluid Motion Frames (AFMF):</strong> off. It generates extra frames but adds latency, which is bad in a competitive game.</li>
<li><strong>Radeon Super Resolution:</strong> off.</li>
<li><strong>Radeon Image Sharpening:</strong> off. If you want more sharpness, use the game's own options.</li>
<li><strong>Enhanced Sync:</strong> off.</li>
<li><strong>Wait for Vertical Refresh:</strong> "Off, unless application specifies", and V-Sync off in the game.</li>
<li><strong>Frame Rate Target Control:</strong> off. To cap FPS, use <code>fps_max</code> in your {{g:autoexec}}.</li>
<li><strong>Instant Replay / recording:</strong> off if you don't use it. Recording all the time costs performance.</li>
</ul>
<h2>Fine to turn on</h2>
<ul>
<li><strong>Smart Access Memory</strong> (AMD's Resizable BAR), if your PC supports it. See {{g:resizable-bar}}.</li>
</ul>
<h2>Keep the driver current</h2>
<p>Update from Adrenalin itself. See {{g:driver}}.</p>
""",
  },
},
]

# Rótulos da página de guia.
UI = {
  "pt": {"guides": "Guias", "guides_lead": "Passo a passo dos assuntos que mais aparecem no Raio-X e nos chamados.",
         "help": "Central de ajuda", "related": "Leia também", "updated": "Atualizado em",
         "cta_t": "Faça isso em poucos cliques", "cta_d": "O CSBoost encontra o que está segurando o seu FPS, aplica os ajustes com o valor anterior guardado e desfaz tudo quando você quiser. Grátis, sem anúncio e sem tocar no jogo.",
         "cta_b": "Baixar o CSBoost grátis", "ticket": "Ainda com dúvida? Abra um chamado"},
  "es": {"guides": "Guías", "guides_lead": "Paso a paso de los temas que más aparecen en Rayos X y en los tickets.",
         "help": "Centro de ayuda", "related": "Lee también", "updated": "Actualizado el",
         "cta_t": "Hazlo en pocos clics", "cta_d": "CSBoost encuentra lo que frena tus FPS, aplica los ajustes guardando el valor anterior y deshace todo cuando quieras. Gratis, sin anuncios y sin tocar el juego.",
         "cta_b": "Descargar CSBoost gratis", "ticket": "¿Sigues con dudas? Abre un ticket"},
  "en": {"guides": "Guides", "guides_lead": "Step-by-step guides for the topics that come up most in the PC Scan and in tickets.",
         "help": "Help center", "related": "Read next", "updated": "Updated",
         "cta_t": "Do it in a few clicks", "cta_d": "CSBoost finds what's holding your FPS back, applies tweaks with the previous value saved and undoes everything whenever you want. Free, no ads and without touching the game.",
         "cta_b": "Download CSBoost free", "ticket": "Still stuck? Open a ticket"},
}
