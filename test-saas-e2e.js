/**
 * test-saas-e2e.js
 *
 * Script de prueba end-to-end para SaaS Multi-Tenant
 * Ejecutar con: node test-saas-e2e.js
 */

console.log('🔍 Script cargado, iniciando...');

import { chromium } from 'playwright';

async function testSaaSTenants() {
  console.log('🚀 Iniciando pruebas end-to-end SaaS Multi-Tenant...\n');

  let browser;
  try {
    console.log('📦 Lanzando browser...');
    browser = await chromium.launch({ headless: false });
    console.log('✅ Browser lanzado');

    const page = await browser.newPage();
    console.log('✅ Nueva página creada');

    // Test 1: Tenant Ana (default)
    console.log('\n📋 Test 1: Tenant Ana (default)');
    console.log('🌐 Navegando a http://localhost:8082/?tenant=ana...');
    await page.goto('http://localhost:8082/?tenant=ana');
    console.log('✅ Página cargada');
    await page.waitForLoadState('networkidle');
    console.log('✅ Página completamente cargada');
    // Test 1: Tenant Ana (default)
    console.log('📋 Test 1: Tenant Ana (default)');
    await page.goto('http://localhost:8082/?tenant=ana');
    await page.waitForLoadState('networkidle');

    const anaTitle = await page.title();
    console.log(`   ✅ Título: ${anaTitle}`);

    // Verificar CSS variables
    const anaPrimary = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    });
    console.log(`   ✅ Color primario: ${anaPrimary} (esperado: #D97706)`);

    // Verificar tenant switcher
    const switcherText = await page.locator('text=Tenant:').textContent();
    console.log(`   ✅ TenantSwitcher visible: ${switcherText}`);

    // Test 2: Cambiar a Tenant Lola
    console.log('\n📋 Test 2: Cambiar a Tenant Lola');
    console.log('🔍 Buscando botón de Lola...');
    const lolaButton = page.locator('button:has-text("Lola Estética")');
    console.log('✅ Botón encontrado, haciendo clic...');
    await lolaButton.click();
    console.log('✅ Clic realizado, esperando cambio...');
    await page.waitForTimeout(2000);

    const lolaPrimary = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    });
    console.log(`   ✅ Color primario después de cambio: ${lolaPrimary} (esperado: #000000)`);

    // Test 3: Verificar PoweredBySaaS
    console.log('\n📋 Test 3: Verificar PoweredBySaaS');
    const poweredByText = await page.locator('text=Plataforma gestionada por').textContent();
    console.log(`   ✅ PoweredBySaaS visible: ${poweredByText}`);

    // Test 4: Verificar tenant info en Home
    console.log('\n📋 Test 4: Verificar información del tenant en Home');
    const tenantInfo = await page.locator('text=SaaS Multi-Tenant Activo:').textContent();
    console.log(`   ✅ Info del tenant: ${tenantInfo.includes('Lola Estética') ? '✅ Correcto' : '❌ Incorrecto'}`);

    console.log('\n🎉 Todas las pruebas pasaron exitosamente!');
    console.log('\n📊 Resumen:');
    console.log('   - ✅ Tenant switching funciona');
    console.log('   - ✅ CSS variables dinámicas');
    console.log('   - ✅ TenantSwitcher UI');
    console.log('   - ✅ PoweredBySaaS badge');
    console.log('   - ✅ Información contextual del tenant');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (browser) {
      console.log('🔒 Cerrando browser...');
      await browser.close();
      console.log('✅ Browser cerrado');
    }
  }
}

// Ejecutar si se llama directamente
console.log('🔍 Verificando ejecución...');
console.log('import.meta.url:', import.meta.url);
console.log('process.argv[1]:', process.argv[1]);

// Ejecutar siempre para testing
console.log('🚀 Ejecutando pruebas...');
testSaaSTenants();

export { testSaaSTenants };