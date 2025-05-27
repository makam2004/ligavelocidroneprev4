import express from 'express';
import supabase from '../supabaseClient.js';
import puppeteer from 'puppeteer';

const router = express.Router();

async function scrapeNombreEscenarioYPista(escena, pista) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const url = `https://www.velocidrone.com/leaderboard/${escena}/${pista}/All`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const nombreEscenario = await page.$eval('h2.text-center', el => el.textContent.trim());
  const nombrePista = await page.$eval('div.container h3', el => el.textContent.trim());

  await browser.close();
  return { nombreEscenario, nombrePista };
}

router.get('/api/configuracion', async (_req, res) => {
  try {
    const { data: config, error } = await supabase
      .from('configuracion')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) throw error;

    // Scrapea nombres para track 1 y track 2
    const track1 = await scrapeNombreEscenarioYPista(config.track1_escena, config.track1_pista);
    const track2 = await scrapeNombreEscenarioYPista(config.track2_escena, config.track2_pista);

    res.json({
      track1_escena: config.track1_escena,
      track1_pista: config.track1_pista,
      track1_nombreEscenario: track1.nombreEscenario,
      track1_nombrePista: track1.nombrePista,
      track2_escena: config.track2_escena,
      track2_pista: config.track2_pista,
      track2_nombreEscenario: track2.nombreEscenario,
      track2_nombrePista: track2.nombrePista,
    });
  } catch (err) {
    console.error('Error al obtener configuración:', err);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

export default router;
