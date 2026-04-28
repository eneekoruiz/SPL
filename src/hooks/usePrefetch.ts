/**
 * hooks/usePrefetch.ts
 *
 * Hook para prefetching agresivo de datos críticos
 * Mejora significativamente el rendimiento percibido
 */

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';

export const usePrefetchCriticalData = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch servicios (datos críticos que se usan en muchas páginas)
    const prefetchServices = async () => {
      try {
        const q = query(collection(db, 'services'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).filter(s => s.visible !== false)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

        // Cache con tiempo largo
        queryClient.setQueryData(['services', false], data, {
          updatedAt: Date.now(),
        });
      } catch (error) {
        console.warn('Error prefetching services:', error);
      }
    };

    // Prefetch contenido de páginas principales
    const prefetchPageContent = async () => {
      try {
        const collections = ['site_content'];
        for (const coll of collections) {
          const q = query(collection(db, coll));
          const snapshot = await getDocs(q);
          snapshot.docs.forEach(doc => {
            queryClient.setQueryData([coll, doc.id], doc.data(), {
              updatedAt: Date.now(),
            });
          });
        }
      } catch (error) {
        console.warn('Error prefetching page content:', error);
      }
    };

    // Ejecutar prefetching en paralelo
    Promise.all([
      prefetchServices(),
      prefetchPageContent(),
    ]).catch(console.warn);
  }, [queryClient]);
};