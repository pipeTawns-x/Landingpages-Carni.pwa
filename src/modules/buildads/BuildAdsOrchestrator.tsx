import { useMemo, useState } from 'react';
import type { BuildAdsAudioRequest, BuildAdsCampaignRequest, MediaAsset, Product } from '@src/types/database';

export interface BuildAdsOrchestratorProps {
  products: Product[];
}

interface BuildAdsState {
  brief: string;
  objective: 'ventas' | 'leads' | 'trafico' | 'reconocimiento';
  selectedProductId?: number;
  generatedAssets: MediaAsset[];
  iaSwitchActive: boolean;
  scheduleDate: string;
  copyDraft: string;
  loading: boolean;
  approved: boolean;
  error?: string;
}

const initialState: BuildAdsState = {
  brief: '',
  objective: 'ventas',
  generatedAssets: [],
  iaSwitchActive: false,
  scheduleDate: '',
  copyDraft: '',
  loading: false,
  approved: false
};

async function generateCampaignAssets(
  request: BuildAdsCampaignRequest,
  audioRequest: BuildAdsAudioRequest,
  product?: Product
): Promise<MediaAsset[]> {
  try {
    const [predisResponse, audioResponse] = await Promise.all([
      fetch('/api/buildads/predis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      }),
      fetch('/api/buildads/elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(audioRequest)
      })
    ]);

    const predisData = (await predisResponse.json()) as { assets?: Array<{ url: string; type: string }> };
    const audioData = (await audioResponse.json()) as { audio_url?: string; duration?: number };

    const imageAssets: MediaAsset[] = (predisData.assets ?? []).map((asset, index) => ({
      id: `predis-${index}`,
      type: asset.type === 'video' ? 'video' : 'image',
      provider: 'predis' as const,
      content_url: asset.url,
      copy_text: request.prompt,
      is_approved: false
    }));

    if (audioData.audio_url) {
      imageAssets.push({
        id: 'elevenlabs-audio',
        type: 'audio',
        provider: 'elevenlabs',
        content_url: audioData.audio_url,
        copy_text: request.prompt,
        duration: audioData.duration,
        is_approved: false
      });
    }

    if (imageAssets.length > 0) {
      return imageAssets;
    }
  } catch {
    // Fall back to local draft assets for non-blocking admin preview.
  }

  return [
    {
      id: 'manual-image',
      type: 'image',
      provider: 'manual',
      content_url: product?.image_url ?? 'img/products/premium.png',
      copy_text: request.prompt,
      is_approved: false
    },
    {
      id: 'manual-audio',
      type: 'audio',
      provider: 'manual',
      content_url: '',
      copy_text: 'Hola, soy Don Carlos. Tenemos una promoción especial lista para aprobación.',
      is_approved: false,
      duration: 15
    }
  ];
}

export function BuildAdsOrchestrator({ products }: BuildAdsOrchestratorProps): JSX.Element {
  const [state, setState] = useState<BuildAdsState>(initialState);

  const selectedProduct = useMemo(() => {
    return products.find((product) => product.id === state.selectedProductId);
  }, [products, state.selectedProductId]);

  const handleGenerate = async (): Promise<void> => {
    if (!state.brief.trim()) {
      setState((current) => ({ ...current, error: 'Ingresa un brief antes de generar la campaña.' }));
      return;
    }

    setState((current) => ({ ...current, loading: true, error: undefined, approved: false }));

    const request: BuildAdsCampaignRequest = {
      prompt: state.brief,
      format: 'carousel',
      brand_colors: ['#DC2626', '#E4D1B0', '#F59E0B']
    };

    const audioRequest: BuildAdsAudioRequest = {
      text: `Hola, soy Don Carlos. ${state.brief}`,
      voice_id: 'don_carlos_v1',
      stability: 0.75
    };

    const generatedAssets = await generateCampaignAssets(request, audioRequest, selectedProduct);

    setState((current) => ({
      ...current,
      generatedAssets,
      loading: false,
      copyDraft: current.copyDraft || state.brief
    }));
  };

  const handleApprove = (): void => {
    setState((current) => ({
      ...current,
      approved: true,
      generatedAssets: current.generatedAssets.map((asset) => ({ ...asset, is_approved: true }))
    }));
  };

  return (
    <section className="tw-buildads-shell">
      <div className="tw-buildads-shell__intro">
        <p className="tw-kicker">BuildAds Orchestrator</p>
        <h2>Agencia IA 360° para campañas, copys y aprobación humana</h2>
        <p>
          Crea campañas promocionales conectadas al catálogo real, con revisión editorial y switch opcional
          para llevar la oferta a la web cuando se apruebe.
        </p>
      </div>

      <div className="tw-buildads-grid">
        <div className="tw-panel">
          <label className="tw-field">
            <span>Brief creativo</span>
            <textarea
              value={state.brief}
              onChange={(event) => setState((current) => ({ ...current, brief: event.target.value }))}
              placeholder="Ej. Asado de fin de semana con 10% off y foco en cortes premium"
              rows={4}
            />
          </label>

          <div className="tw-panel__split">
            <label className="tw-field">
              <span>Objetivo</span>
              <select
                value={state.objective}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    objective: event.target.value as BuildAdsState['objective']
                  }))
                }
              >
                <option value="ventas">Ventas</option>
                <option value="leads">Leads</option>
                <option value="trafico">Tráfico</option>
                <option value="reconocimiento">Reconocimiento</option>
              </select>
            </label>

            <label className="tw-field">
              <span>Producto vinculado</span>
              <select
                value={state.selectedProductId ?? ''}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    selectedProductId: event.target.value ? Number(event.target.value) : undefined
                  }))
                }
              >
                <option value="">Selecciona producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="tw-panel__split">
            <label className="tw-field">
              <span>Programar publicación</span>
              <input
                type="date"
                value={state.scheduleDate}
                onChange={(event) => setState((current) => ({ ...current, scheduleDate: event.target.value }))}
              />
            </label>

            <label className="tw-toggle-field">
              <span>Publicar como Oferta Especial</span>
              <button
                type="button"
                className={`tw-toggle ${state.iaSwitchActive ? 'tw-toggle--active' : ''}`}
                onClick={() => setState((current) => ({ ...current, iaSwitchActive: !current.iaSwitchActive }))}
              >
                <span />
              </button>
            </label>
          </div>

          <div className="tw-panel__actions">
            <button type="button" className="tw-button tw-button--primary" onClick={handleGenerate}>
              {state.loading ? 'Generando...' : 'Generar con IA'}
            </button>
            <button type="button" className="tw-button tw-button--ghost" onClick={handleApprove}>
              Aprobar campaña
            </button>
          </div>

          {state.error ? <p className="tw-inline-error">{state.error}</p> : null}
          {state.approved ? <p className="tw-inline-success">Campaña aprobada para revisión operativa.</p> : null}
        </div>

        <div className="tw-panel tw-panel--dark">
          <div className="tw-panel__header">
            <h3>Preview editorial</h3>
            <span>{selectedProduct?.name ?? 'Sin producto vinculado'}</span>
          </div>

          <label className="tw-field">
            <span>Copy editable</span>
            <textarea
              rows={3}
              value={state.copyDraft}
              onChange={(event) => setState((current) => ({ ...current, copyDraft: event.target.value }))}
              placeholder="Ajusta el copy antes de aprobar la campaña"
            />
          </label>

          <div className="tw-asset-grid">
            {state.generatedAssets.length === 0 ? (
              <div className="tw-asset-placeholder">
                <p>Las variantes aparecerán aquí con copy, audio y assets ligados al catálogo.</p>
              </div>
            ) : (
              state.generatedAssets.map((asset) => (
                <article className="tw-asset-card" key={asset.id}>
                  {asset.type === 'image' ? (
                    <img src={asset.content_url} alt={asset.copy_text ?? 'Creative asset'} />
                  ) : (
                    <div className="tw-asset-audio">
                      <strong>{asset.provider === 'elevenlabs' ? 'Audio Don Carlos' : 'Audio draft'}</strong>
                      <p>{asset.copy_text}</p>
                    </div>
                  )}
                  <div className="tw-asset-card__meta">
                    <span>{asset.type.toUpperCase()}</span>
                    <span>{asset.provider}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
