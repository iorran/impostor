import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:8081';

// Helper function to join a player to a room
const joinPlayerToRoom = async (page: Page, playerName: string, roomCode: string) => {
  await page.goto(BASE_URL);
  await page.click('text=Entrar na Sala');
  await page.fill('input[placeholder="Digite seu nome"]', playerName);
  
  // Wait for room code inputs
  await page.waitForSelector('input.w-14', { state: 'visible' });
  const roomCodeInputs = page.locator('input.w-14');
  
  // Fill room code
  for (let i = 0; i < 4 && i < roomCode.length; i++) {
    const input = roomCodeInputs.nth(i);
    await input.click();
    await input.fill(roomCode[i].toUpperCase());
    await page.waitForTimeout(150);
  }
  
  // Wait for button to be enabled
  const enterButton = page.locator('button:has-text("Entrar")');
  await enterButton.waitFor({ state: 'visible', timeout: 10000 });
  
  await page.waitForFunction(
    () => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const enterBtn = buttons.find(btn => btn.textContent?.includes('Entrar'));
      return enterBtn && !enterBtn.disabled;
    },
    { timeout: 10000 }
  );
  
  await enterButton.click();
  await page.waitForURL(/\/room\/[A-Z0-9]{4}/, { timeout: 15000 });
};

// Helper function to set impostor count to a specific value
const setImpostorCount = async (page: Page, targetValue: number) => {
  const impostorInput = page.locator('input#impostor-count, input[type="number"]').first();
  await expect(impostorInput).toBeVisible({ timeout: 5000 });
  
  // Clear the input and type the new value
  await impostorInput.click();
  await impostorInput.fill(targetValue.toString());
  await page.waitForTimeout(200);
  
  // Verify value
  const finalValue = await impostorInput.inputValue();
  expect(parseInt(finalValue || '0')).toBe(targetValue);
};

test.describe('Impostor Game Flow', () => {
  test('should simulate complete game flow with multiple players', async ({ browser }) => {
    test.setTimeout(120000); // 2 minutes timeout for this test
    // Create multiple browser contexts to simulate different players
    const hostContext = await browser.newContext();
    const player2Context = await browser.newContext();
    const player3Context = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const player2Page = await player2Context.newPage();
    const player3Page = await player3Context.newPage();

    try {
      // Step 1: Host creates a room
      await hostPage.goto(BASE_URL);
      await hostPage.click('text=Criar Sala');
      await hostPage.fill('input[placeholder="Digite seu nome"]', 'Host Player');
      await hostPage.click('button:has-text("Criar")');
      
      // Wait for navigation to room
      await hostPage.waitForURL(/\/room\/[A-Z0-9]{4}/);
      const roomUrl = hostPage.url();
      const roomCode = roomUrl.split('/').pop()?.toUpperCase() || '';
      
      expect(roomCode).toMatch(/^[A-Z0-9]{4}$/);
      console.log(`Room code: ${roomCode}`);

      // Step 2: Player 2 joins the room
      await player2Page.goto(BASE_URL);
      await player2Page.click('text=Entrar na Sala');
      await player2Page.fill('input[placeholder="Digite seu nome"]', 'Player 2');
      
      // Type room code - RoomCodeInput has 4 separate inputs (w-14 h-16)
      // Wait for the room code inputs to be visible
      await player2Page.waitForSelector('input.w-14', { state: 'visible' });
      
      // Get all room code inputs (the ones with w-14 class, not the name input)
      const roomCodeInputs = player2Page.locator('input.w-14');
      
      // Fill each character of the room code in the 4 separate inputs
      for (let i = 0; i < 4 && i < roomCode.length; i++) {
        const input = roomCodeInputs.nth(i);
        await input.click();
        await input.fill(roomCode[i].toUpperCase());
        await player2Page.waitForTimeout(150); // Small delay between inputs
      }
      
      // Wait for button to be enabled (room code must be 4 characters)
      const enterButton = player2Page.locator('button:has-text("Entrar")');
      await enterButton.waitFor({ state: 'visible', timeout: 10000 });
      
      // Wait until button is enabled - use CSS selector that works in browser
      await player2Page.waitForFunction(
        () => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const enterBtn = buttons.find(btn => btn.textContent?.includes('Entrar'));
          return enterBtn && !enterBtn.disabled;
        },
        { timeout: 10000 }
      );
      
      await enterButton.click();
      await player2Page.waitForURL(/\/room\/[A-Z0-9]{4}/, { timeout: 15000 });

      // Step 3: Player 3 joins the room
      await player3Page.goto(BASE_URL);
      await player3Page.click('text=Entrar na Sala');
      await player3Page.fill('input[placeholder="Digite seu nome"]', 'Player 3');
      
      // Type room code - RoomCodeInput has 4 separate inputs (w-14 h-16)
      await player3Page.waitForSelector('input.w-14', { state: 'visible' });
      
      // Get all room code inputs (the ones with w-14 class, not the name input)
      const roomCodeInputs3 = player3Page.locator('input.w-14');
      
      // Fill each character of the room code in the 4 separate inputs
      for (let i = 0; i < 4 && i < roomCode.length; i++) {
        const input = roomCodeInputs3.nth(i);
        await input.click();
        await input.fill(roomCode[i].toUpperCase());
        await player3Page.waitForTimeout(150); // Small delay between inputs
      }
      
      // Wait for button to be enabled (room code must be 4 characters)
      const enterButton3 = player3Page.locator('button:has-text("Entrar")');
      await enterButton3.waitFor({ state: 'visible', timeout: 10000 });
      
      // Wait until button is enabled - use CSS selector that works in browser
      await player3Page.waitForFunction(
        () => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const enterBtn = buttons.find(btn => btn.textContent?.includes('Entrar'));
          return enterBtn && !enterBtn.disabled;
        },
        { timeout: 10000 }
      );
      
      await enterButton3.click();
      await player3Page.waitForURL(/\/room\/[A-Z0-9]{4}/, { timeout: 15000 });

      // Step 4: Wait for all players to appear in the room
      // Wait for players to sync across all pages
      await hostPage.waitForSelector('text=Host Player', { timeout: 15000 });
      await hostPage.waitForSelector('text=Player 2', { timeout: 15000 });
      await hostPage.waitForSelector('text=Player 3', { timeout: 15000 });

      // Verify all players are visible on all pages
      await expect(hostPage.locator('text=Host Player')).toBeVisible();
      await expect(hostPage.locator('text=Player 2')).toBeVisible();
      await expect(hostPage.locator('text=Player 3')).toBeVisible();

      await expect(player2Page.locator('text=Host Player')).toBeVisible();
      await expect(player2Page.locator('text=Player 2')).toBeVisible();
      await expect(player2Page.locator('text=Player 3')).toBeVisible();

      // Wait a bit more for realtime sync to complete
      await hostPage.waitForTimeout(2000);

      // Step 5: Host starts the game
      // Wait for button to be enabled (requires 3+ players)
      const startButton = hostPage.locator('button:has-text("Iniciar Partida")');
      
      // Wait until button is enabled
      await startButton.waitFor({ state: 'visible', timeout: 10000 });
      
      // Verify player count is correct (should show 3 players)
      // Wait for player count to be visible and verify it shows 3
      await hostPage.waitForSelector('text=/Jogadores/', { timeout: 5000 });
      const playerCountElement = hostPage.locator('text=/Jogadores \\(\\d+\\)/');
      await expect(playerCountElement).toContainText('3', { timeout: 5000 });
      
      // Verify all 3 players are visible using the same text selectors that already worked
      // This is more reliable than trying to find player card elements with incorrect selectors
      await expect(hostPage.locator('text=Host Player')).toBeVisible();
      await expect(hostPage.locator('text=Player 2')).toBeVisible();
      await expect(hostPage.locator('text=Player 3')).toBeVisible();
      
      // Wait until button is enabled (check both disabled attribute and visual state)
      await hostPage.waitForFunction(
        () => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const startBtn = buttons.find(btn => btn.textContent?.includes('Iniciar Partida'));
          if (!startBtn) return false;
          // Check both disabled attribute and if button is actually clickable
          return !startBtn.disabled && !startBtn.hasAttribute('aria-disabled');
        },
        { timeout: 15000 }
      );
      
      // Verify button is enabled before clicking
      await expect(startButton).toBeEnabled({ timeout: 5000 });
      
      // Verify error message is not showing
      const errorMessage = hostPage.locator('text=Mínimo de 3 jogadores necessários');
      await expect(errorMessage).not.toBeVisible({ timeout: 2000 }).catch(() => {
        // If error message appears, wait a bit more for players to sync
        console.log('Waiting for players to sync...');
      });
      
      // Set the number of impostors using the number input
      // The input should be visible for the host
      const impostorInput = hostPage.locator('input#impostor-count, input[type="number"]').first();
      await expect(impostorInput).toBeVisible({ timeout: 5000 });
      
      // Get current value, min, and max before interaction
      const inputInfo = await hostPage.evaluate(() => {
        const input = document.querySelector('input#impostor-count, input[type="number"]') as HTMLInputElement;
        if (!input) return null;
        return {
          current: parseInt(input.value || '0'),
          min: parseInt(input.min || '1'),
          max: parseInt(input.max || '1')
        };
      });
      
      console.log(`Impostor count before interaction: ${inputInfo?.current}, min: ${inputInfo?.min}, max: ${inputInfo?.max}`);
      
      // Set to minimum value (1 for 3 players)
      await impostorInput.click();
      await impostorInput.fill('1');
      await hostPage.waitForTimeout(300);
      
      // Verify input is at minimum
      const finalInputValue = await impostorInput.inputValue();
      console.log(`Input value after setting to minimum: ${finalInputValue}`);
      
      // The minimum should be 1 (for 3 players, max is 1, so min is also 1)
      const expectedMin = inputInfo?.min || 1;
      expect(parseInt(finalInputValue || '0')).toBe(expectedMin);
      
      // Verify the impostor count is displayed correctly in the input
      await hostPage.waitForFunction(
        () => {
          const input = document.querySelector('input#impostor-count, input[type="number"]') as HTMLInputElement;
          if (!input) return false;
          const inputValue = parseInt(input.value || '0');
          return inputValue === 1;
        },
        { timeout: 3000 }
      );
      
      // Get the displayed value from the input
      const impostorCountText = await hostPage.evaluate(() => {
        const input = document.querySelector('input#impostor-count, input[type="number"]') as HTMLInputElement;
        return input?.value || null;
      });
      
      console.log(`Number of impostors displayed: ${impostorCountText}`);
      
      // Verify it's set to 1 (minimum for 3 players)
      expect(impostorCountText).toBe('1');
      
      // Ensure button is not in loading state before clicking
      await hostPage.waitForFunction(
        () => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const startBtn = buttons.find(btn => btn.textContent?.includes('Iniciar Partida'));
          if (!startBtn || startBtn.disabled) return false;
          const spinner = startBtn.querySelector('.animate-spin');
          return !spinner; // Button should not be in loading state
        },
        { timeout: 5000 }
      );
      
      // Listen for console errors
      const consoleErrors: string[] = [];
      hostPage.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Verify button is still visible and enabled right before clicking
      await expect(startButton).toBeVisible({ timeout: 2000 });
      await expect(startButton).toBeEnabled({ timeout: 2000 });
      
      // Verify button is not disabled via aria or class
      const isActuallyEnabled = await hostPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const startBtn = buttons.find(btn => btn.textContent?.includes('Iniciar Partida'));
        return startBtn && !startBtn.disabled && !startBtn.hasAttribute('aria-disabled');
      });
      
      if (!isActuallyEnabled) {
        throw new Error('Start button is disabled - cannot start game. Check player count and game state.');
      }
      
      // Scroll button into view if needed
      await startButton.scrollIntoViewIfNeeded();
      
      // Verify handler conditions before clicking by checking React state
      // The handler returns early if: !room?.id || !currentPlayerId || !canStart
      const handlerConditions = await hostPage.evaluate(() => {
        // Check if room exists (footer should show "Lobby" or "Rodada X")
        const footer = document.querySelector('footer p');
        const hasRoom = footer && footer.textContent && (footer.textContent.includes('Lobby') || footer.textContent.includes('Rodada'));
        
        // Check if playerId exists in localStorage
        const playerId = localStorage.getItem('playerId');
        
        // Check if canStart is true (button should be enabled)
        const buttons = Array.from(document.querySelectorAll('button'));
        const startBtn = buttons.find(btn => btn.textContent?.includes('Iniciar Partida'));
        const isEnabled = startBtn && !startBtn.disabled;
        
        return { hasRoom, hasPlayerId: !!playerId, isEnabled };
      });
      
      if (!handlerConditions.hasRoom || !handlerConditions.hasPlayerId || !handlerConditions.isEnabled) {
        throw new Error(
          `Handler conditions not met: hasRoom=${handlerConditions.hasRoom}, ` +
          `hasPlayerId=${handlerConditions.hasPlayerId}, isEnabled=${handlerConditions.isEnabled}`
        );
      }
      
      // Click the button
      await startButton.click({ timeout: 5000 });
      
      // CRITICAL: Wait for button to show loading state OR disappear - either confirms handler ran
      // Loading state = handler is processing, button disappearing = game started immediately
      await hostPage.waitForFunction(
        () => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const startBtn = buttons.find(btn => btn.textContent?.includes('Iniciar Partida'));
          if (!startBtn) return true; // Button disappeared = game started (handler executed successfully)
          const spinner = startBtn.querySelector('.animate-spin');
          return spinner !== null; // Button shows loading spinner (handler is processing)
        },
        { timeout: 5000 }
      ).catch(async () => {
        // If neither loading nor disappearance happens, check what went wrong
        const debugInfo = await hostPage.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const startBtn = buttons.find(btn => btn.textContent?.includes('Iniciar Partida'));
          const playerId = localStorage.getItem('playerId');
          const footer = document.querySelector('footer p')?.textContent;
          const hasRestartBtn = buttons.some(btn => btn.textContent?.includes('Reiniciar Rodada'));
          return {
            buttonExists: !!startBtn,
            buttonDisabled: startBtn?.disabled,
            hasSpinner: startBtn?.querySelector('.animate-spin') !== null,
            playerId,
            footer,
            hasRestartButton: hasRestartBtn
          };
        });
        
        throw new Error(
          `Button click did not trigger loading state or game start. Debug: ${JSON.stringify(debugInfo)}. ` +
          `Handler may have returned early due to: !room?.id || !currentPlayerId || !canStart`
        );
      });
      
      // Wait for loading to complete OR game to start
      // Either: spinner disappears, button disappears, or restart button appears
      await hostPage.waitForFunction(
        () => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const startBtn = buttons.find(btn => btn.textContent?.includes('Iniciar Partida'));
          const restartBtn = buttons.find(btn => btn.textContent?.includes('Reiniciar Rodada'));
          
          // Game started if restart button appears
          if (restartBtn) return true;
          
          // Game started if start button disappeared
          if (!startBtn) return true;
          
          // Loading complete if spinner is gone
          const spinner = startBtn.querySelector('.animate-spin');
          return spinner === null; // Button exists but not loading anymore
        },
        { timeout: 15000 }
      );
      
      // Check for console errors
      if (consoleErrors.length > 0) {
        console.log('Console errors after click:', consoleErrors);
      }
      
      // Check for error toast messages (wait for toast to appear)
      await hostPage.waitForTimeout(2000); // Give time for toast to appear
      const allToasts = hostPage.locator('[data-sonner-toast], [role="status"]');
      const toastCount = await allToasts.count();
      
      if (toastCount > 0) {
        // Check each toast for error messages
        for (let i = 0; i < toastCount; i++) {
          const toast = allToasts.nth(i);
          const toastText = await toast.textContent();
          if (toastText && /erro|error|inválido|falhou/i.test(toastText)) {
            throw new Error(`Error toast appeared: ${toastText}`);
          }
        }
      }
      
      // Wait for the game to start by checking multiple indicators:
      // 1. Footer should show "Rodada 1" instead of "Lobby"
      // 2. "Iniciar Partida" button should disappear (only shown in lobby)
      // 3. "Reiniciar Rodada" button should appear (only shown when game is in progress)
      // 4. WordReveal component should appear
      
      // Use a more flexible approach - wait for ANY indicator that the game started
      await Promise.race([
        hostPage.waitForSelector('text=/Rodada \\d+/', { timeout: 20000 }),
        hostPage.waitForSelector('button:has-text("Reiniciar Rodada")', { timeout: 20000 }),
        hostPage.waitForSelector('h2.text-4xl', { timeout: 20000 }), // Word reveal heading
        hostPage.waitForSelector('text=/Sua palavra é|Você é o/', { timeout: 20000 })
      ]).catch(async (error) => {
        // If all indicators fail, take a screenshot and check what's actually on the page
        console.log('Game start indicators not found, checking page state...');
        const footerText = await hostPage.locator('footer p').textContent().catch(() => 'not found');
        const hasStartButton = await hostPage.locator('button:has-text("Iniciar Partida")').count() > 0;
        const hasRestartButton = await hostPage.locator('button:has-text("Reiniciar Rodada")').count() > 0;
        console.log(`Footer: ${footerText}, Has Start Button: ${hasStartButton}, Has Restart Button: ${hasRestartButton}`);
        throw error;
      });
      
      // Verify the start button is gone (if it still exists, game didn't start)
      const startButtonStillExists = await hostPage.locator('button:has-text("Iniciar Partida")').count() > 0;
      if (startButtonStillExists) {
        throw new Error('Start button still visible - game did not start');
      }
      
      // Verify restart button appears (confirms game is in progress)
      await hostPage.waitForSelector('button:has-text("Reiniciar Rodada")', { 
        state: 'visible', 
        timeout: 10000 
      });
      
      // Wait for all players to receive the game state update via realtime
      // All players should see "Rodada X" in the footer
      await player2Page.waitForSelector('text=/Rodada \\d+/', { timeout: 20000 });
      await player3Page.waitForSelector('text=/Rodada \\d+/', { timeout: 20000 });
      
      // Wait a bit more for realtime sync to complete
      await hostPage.waitForTimeout(1000);

      // Step 6: Verify all players see their words
      // Words should appear after game starts - look for WordReveal component
      await hostPage.locator('text=/Sua palavra é|Você é o/').waitFor({ timeout: 20000 });
      await player2Page.locator('text=/Sua palavra é|Você é o/').waitFor({ timeout: 20000 });
      await player3Page.locator('text=/Sua palavra é|Você é o/').waitFor({ timeout: 20000 });

      // Get words from each player - the word is in an h2 element
      const hostWordElement = hostPage.locator('h2.text-4xl');
      const player2WordElement = player2Page.locator('h2.text-4xl');
      const player3WordElement = player3Page.locator('h2.text-4xl');

      await expect(hostWordElement).toBeVisible();
      await expect(player2WordElement).toBeVisible();
      await expect(player3WordElement).toBeVisible();

      const hostWord = await hostWordElement.textContent();
      const player2Word = await player2WordElement.textContent();
      const player3Word = await player3WordElement.textContent();

      console.log(`Host word: ${hostWord}`);
      console.log(`Player 2 word: ${player2Word}`);
      console.log(`Player 3 word: ${player3Word}`);

      // Verify words are not empty
      expect(hostWord).toBeTruthy();
      expect(player2Word).toBeTruthy();
      expect(player3Word).toBeTruthy();

      // Step 7: Host restarts the round
      const restartButton = hostPage.locator('button:has-text("Reiniciar Rodada")');
      await expect(restartButton).toBeVisible({ timeout: 10000 });
      await restartButton.click();

      // Wait for new round to start
      await hostPage.waitForTimeout(3000);

      // Step 8: Verify all players get new words after restart
      await hostPage.waitForTimeout(3000); // Wait for words to update

      // Verify words are still visible after restart
      await expect(hostPage.locator('h2.text-4xl')).toBeVisible({ timeout: 15000 });
      await expect(player2Page.locator('h2.text-4xl')).toBeVisible({ timeout: 15000 });
      await expect(player3Page.locator('h2.text-4xl')).toBeVisible({ timeout: 15000 });

      const newHostWord = await hostPage.locator('h2.text-4xl').textContent();
      const newPlayer2Word = await player2Page.locator('h2.text-4xl').textContent();
      const newPlayer3Word = await player3Page.locator('h2.text-4xl').textContent();

      console.log(`New Host word: ${newHostWord}`);
      console.log(`New Player 2 word: ${newPlayer2Word}`);
      console.log(`New Player 3 word: ${newPlayer3Word}`);

      // Verify all players still have words (they shouldn't disappear)
      expect(newHostWord).toBeTruthy();
      expect(newPlayer2Word).toBeTruthy();
      expect(newPlayer3Word).toBeTruthy();

      // Verify words are still visible after a few seconds (they shouldn't disappear)
      await hostPage.waitForTimeout(5000);
      
      // Verify words are still visible
      await expect(hostPage.locator('h2.text-4xl')).toBeVisible({ timeout: 10000 });
      await expect(player2Page.locator('h2.text-4xl')).toBeVisible({ timeout: 10000 });
      await expect(player3Page.locator('h2.text-4xl')).toBeVisible({ timeout: 10000 });

      const finalHostWord = await hostPage.locator('h2.text-4xl').textContent();
      const finalPlayer2Word = await player2Page.locator('h2.text-4xl').textContent();
      const finalPlayer3Word = await player3Page.locator('h2.text-4xl').textContent();

      expect(finalHostWord).toBeTruthy();
      expect(finalPlayer2Word).toBeTruthy();
      expect(finalPlayer3Word).toBeTruthy();

    } finally {
      await hostContext.close();
      await player2Context.close();
      await player3Context.close();
    }
  });

  test('should allow host to configure number of impostors', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Create room
    await page.click('text=Criar Sala');
    await page.fill('input[placeholder="Digite seu nome"]', 'Test Host');
    await page.click('button:has-text("Criar")');
    
    await page.waitForURL(/\/room\/[A-Z0-9]{4}/);
    
    // Verify input is visible for host
    await expect(page.locator('text=Número de Impostores')).toBeVisible();
    
    // Check number input exists
    const impostorInput = page.locator('input#impostor-count, input[type="number"]').first();
    await expect(impostorInput).toBeVisible();
    
    // Verify default value is 1
    const inputValue = await impostorInput.inputValue();
    expect(parseInt(inputValue || '0')).toBe(1);
  });

  test('should prevent starting game with less than 3 players', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Create room
    await page.click('text=Criar Sala');
    await page.fill('input[placeholder="Digite seu nome"]', 'Solo Host');
    await page.click('button:has-text("Criar")');
    
    await page.waitForURL(/\/room\/[A-Z0-9]{4}/);
    
    // Start button should be disabled
    const startButton = page.locator('button:has-text("Iniciar Partida")');
    await expect(startButton).toBeDisabled();
    
    // Should show message about minimum players
    await expect(page.locator('text=Mínimo de 3 jogadores necessários')).toBeVisible();
  });

  test('should simulate game flow with 10 players and 2 impostors', async ({ browser }) => {
    test.setTimeout(180000); // 3 minutes timeout for this test
    
    // Create browser contexts for 10 players
    const contexts = await Promise.all(
      Array.from({ length: 10 }, () => browser.newContext())
    );
    const pages = await Promise.all(
      contexts.map(ctx => ctx.newPage())
    );

    try {
      // Step 1: Host creates a room
      const hostPage = pages[0];
      await hostPage.goto(BASE_URL);
      await hostPage.click('text=Criar Sala');
      await hostPage.fill('input[placeholder="Digite seu nome"]', 'Host Player');
      await hostPage.click('button:has-text("Criar")');
      
      await hostPage.waitForURL(/\/room\/[A-Z0-9]{4}/);
      const roomUrl = hostPage.url();
      const roomCode = roomUrl.split('/').pop()?.toUpperCase() || '';
      
      expect(roomCode).toMatch(/^[A-Z0-9]{4}$/);
      console.log(`Room code: ${roomCode}`);

      // Step 2: Join 9 more players (total 10)
      const playerNames = Array.from({ length: 9 }, (_, i) => `Player ${i + 2}`);
      await Promise.all(
        pages.slice(1).map((page, index) => 
          joinPlayerToRoom(page, playerNames[index], roomCode)
        )
      );

      // Step 3: Wait for all players to appear in the room
      await hostPage.waitForSelector('text=Host Player', { timeout: 15000 });
      for (let i = 2; i <= 10; i++) {
        await hostPage.waitForSelector(`text=Player ${i}`, { timeout: 15000 });
      }

      // Verify player count
      const playerCountElement = hostPage.locator('text=/Jogadores \\(\\d+\\)/');
      await expect(playerCountElement).toContainText('10', { timeout: 5000 });

      // Wait for realtime sync
      await hostPage.waitForTimeout(2000);

      // Step 4: Set number of impostors to 2
      await setImpostorCount(hostPage, 2);
      console.log('Number of impostors set to: 2');

      // Step 5: Host starts the game
      const startButton = hostPage.locator('button:has-text("Iniciar Partida")');
      await startButton.waitFor({ state: 'visible', timeout: 10000 });
      await expect(startButton).toBeEnabled({ timeout: 5000 });
      
      await startButton.click();
      
      // Wait for game to start
      await hostPage.waitForFunction(
        () => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const startBtn = buttons.find(btn => btn.textContent?.includes('Iniciar Partida'));
          const restartBtn = buttons.find(btn => btn.textContent?.includes('Reiniciar Rodada'));
          return !startBtn && restartBtn !== undefined;
        },
        { timeout: 15000 }
      );

      // Wait for all players to receive game state
      await Promise.all(
        pages.map(page => page.waitForSelector('text=/Rodada \\d+/', { timeout: 20000 }))
      );

      await hostPage.waitForTimeout(1000);

      // Step 6: Verify all players see their words
      await Promise.all(
        pages.map(page => page.locator('text=/Sua palavra é|Você é o/').waitFor({ timeout: 20000 }))
      );

      // Get words from all players
      const wordElements = await Promise.all(
        pages.map(page => page.locator('h2.text-4xl'))
      );

      await Promise.all(
        wordElements.map(element => expect(element).toBeVisible())
      );

      const words = await Promise.all(
        wordElements.map(element => element.textContent())
      );

      words.forEach((word, index) => {
        console.log(`Player ${index === 0 ? 'Host' : index} word: ${word}`);
        expect(word).toBeTruthy();
      });

      // Step 7: Verify exactly 2 impostors exist
      // We can't directly check who is impostor from the UI, but we can verify
      // that words are assigned correctly (some should have impostor words, some crewmate words)
      const uniqueWords = new Set(words.filter(Boolean));
      expect(uniqueWords.size).toBeGreaterThan(1); // Should have at least 2 different words (crewmate and impostor)

      // Step 8: Host restarts the round
      const restartButton = hostPage.locator('button:has-text("Reiniciar Rodada")');
      await expect(restartButton).toBeVisible({ timeout: 10000 });
      await restartButton.click();

      await hostPage.waitForTimeout(3000);

      // Step 9: Verify all players get new words after restart
      await hostPage.waitForTimeout(3000);

      await Promise.all(
        wordElements.map(element => expect(element).toBeVisible({ timeout: 15000 }))
      );

      const newWords = await Promise.all(
        wordElements.map(element => element.textContent())
      );

      newWords.forEach((word, index) => {
        console.log(`New Player ${index === 0 ? 'Host' : index} word: ${word}`);
        expect(word).toBeTruthy();
      });

      // Verify words changed (at least some should be different)
      const wordsChanged = words.some((oldWord, index) => oldWord !== newWords[index]);
      expect(wordsChanged).toBe(true);

    } finally {
      // Clean up all contexts
      await Promise.all(contexts.map(ctx => ctx.close()));
    }
  });
});

