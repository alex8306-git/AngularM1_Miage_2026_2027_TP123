import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Page } from '../models/page.model';
import { Track } from '../models/track.model';

/** Limite du backend : multer refuse au-delà (app.js, MAX_FILE_SIZE). */
export const MAX_AUDIO_SIZE = 25 * 1024 * 1024;

/** Liste blanche du backend (app.js, constante `allowed`). */
export const ALLOWED_AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a',
]);

/** Encapsulates all HTTP operations for backing tracks. */
@Injectable({ providedIn: 'root' })
export class TrackService {
  private readonly http = inject(HttpClient);

  list(page = 1, limit = 5) {
    return this.http.get<Page<Track>>('/api/tracks', {
      params: { page, limit },
    });
  }

  upload(file: File, title: string) {
    // Les deux champs multipart attendus par le backend : exactement `audio` et `title`.
    const body = new FormData();
    body.append('audio', file);
    body.append('title', title);
    return this.http.post<Track>('/api/tracks', body);
  }

  audio(id: string) {
    return this.http.get(`/api/tracks/${id}/audio`, {
      responseType: 'blob',
    });
  }

  /**
   * Répète côté navigateur les contrôles que le backend applique de toute façon.
   * Renvoie le message à afficher, ou null si le fichier est acceptable.
   * Ce contrôle est un confort : le serveur reste seul juge.
   */
  validate(file: File): string | null {
    if (!ALLOWED_AUDIO_TYPES.has(file.type)) {
      return `Format refusé (${file.type || 'type inconnu'}). Formats acceptés : MP3, WAV, OGG, M4A.`;
    }

    if (file.size > MAX_AUDIO_SIZE) {
      const megaoctets = (file.size / (1024 * 1024)).toFixed(1);
      return `Fichier trop volumineux (${megaoctets} Mo). Maximum : 25 Mo.`;
    }

    return null;
  }
}
