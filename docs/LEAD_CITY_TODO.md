# Lead City - Próximos Passos para Modo Solo

## ✅ Concluído

- **LobbyScene simplificado** - Botão único "Jogar" para start direto
- **Removido botão "Criar Sala Geral"** da página principal
- **UI melhorado** - Título maior, ícone, instruções de controle
- **Efeitos hover** no botão (escala e cor)

## 🚧 Próximo Passo Crítico: Ajustar GameScene.ts

O **GameScene.ts** precisa ser atualizado para funcionar corretamente sem socket (modo solo).

### Localizações que precisam de ajuste:

#### 1. Método `update()` - Linha ~137
**Problema:** Tenta enviar posição via socket sempre
```typescript
// Sync position with other players
if (this.socket && this.roomName) {
  (this.socket as any).emit('update-position', {
    roomName: this.roomName,
    position: { x: this.player.x, y: this.player.y }
  });
}
```
**Solução:** Já tem o `if (this.socket)` - OK! ✅

#### 2. Método `collectItem()` - Linha ~216
**Problema:** Tenta notificar servidor quando coleta item
```typescript
// Notify server
if (this.socket && this.roomName) {
  (this.socket as any).emit('collect-item', {
    roomName: this.roomName,
    itemId: itemId,
    points: finalPoints
  });
}
```
**Solução:** Já tem o `if (this.socket)` - OK! ✅

#### 3. Método `endGame()` - Linha ~239
**Problema:** Tenta notificar servidor de game over
```typescript
// Notify server
if (this.socket && this.roomName) {
  (this.socket as any).emit('game-over', {
    roomName: this.roomName,
    finalScore: this.score,
    distance: Math.round(this.distance)
  });
}
```
**Solução:** Já tem o `if (this.socket)` - OK! ✅

#### 4. Método `setupSocketEvents()` - Linha ~132
**Problema:** Tenta configurar listeners de socket
```typescript
private setupSocketEvents() {
  if (!this.socket) return; // ✅ Já tem proteção!
  
  const socket = this.socket as any;
  // ... resto do código
}
```
**Solução:** Já tem o `if (!this.socket) return` - OK! ✅

### 🎉 Conclusão

**O código atual do GameScene.ts já está preparado para modo solo!**

Todas as referências ao socket já têm validações `if (this.socket)` apropriadas.
O jogo deve funcionar perfeitamente em modo solo sem modificações adicionais.

## 📦 Testing Checklist

- [ ] Testar botão "Jogar" inicia o jogo
- [ ] Verificar que o jogo roda sem erros de socket
- [ ] Confirmar que itens são coletados corretamente
- [ ] Validar que pontuação é salva no Supabase
- [ ] Testar game over funciona corretamente
- [ ] Verificar que não há outros jogadores na tela

## 🚀 Deploy

Depois de testar localmente:
1. Build do projeto: `npm run build`
2. Testar em produção
3. Monitorar logs de erros

## 📝 Notas

- Modo multiplayer ainda disponível via servidor Socket.IO
- Possível adicionar menu futuro para escolher Solo vs Multiplayer
- Considerar adicionar opção de filtro por diretoria no modo equipe
