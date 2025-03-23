import { useState, useEffect, useCallback } from 'react';
import { env } from '../config/env';

interface FetchOptions {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, string>;
  body?: object;
  headers?: Record<string, string>;
  autoFetch?: boolean;
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  timestamp: number | null;
}

export function useDataFetching<T = any>(options: FetchOptions) {
  const {
    endpoint,
    method = 'GET',
    params = {},
    body,
    headers = {},
    autoFetch = true
  } = options;

  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: autoFetch,
    error: null,
    timestamp: null
  });

  // Build URL with query parameters
  const buildUrl = useCallback(() => {
    const url = new URL(`${env.API_URL}/${endpoint}`);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    return url.toString();
  }, [endpoint, params]);

  // Fetch data function
  const fetchData = useCallback(async (customOptions?: Partial<FetchOptions>) => {
    // Merge default options with custom options
    const mergedOptions = {
      ...options,
      ...customOptions
    };
    
    // Prepare request options
    const requestOptions: RequestInit = {
      method: mergedOptions.method,
      headers: {
        'Content-Type': 'application/json',
        ...mergedOptions.headers
      }
    };
    
    // Add body for non-GET requests
    if (mergedOptions.method !== 'GET' && mergedOptions.body) {
      requestOptions.body = JSON.stringify(mergedOptions.body);
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Build URL with updated params
      const url = customOptions?.params 
        ? new URL(`${env.API_URL}/${mergedOptions.endpoint}`).toString() 
        : buildUrl();
      
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      setState({
        data: responseData,
        loading: false,
        error: null,
        timestamp: Date.now()
      });
      
      return responseData;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorObj,
        timestamp: Date.now()
      }));
      
      throw errorObj;
    }
  }, [options, buildUrl]);

  // Automatically fetch data on mount if autoFetch is true
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  // Refresh data with the same parameters
  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  // Fetch with new parameters
  const fetchWithParams = useCallback((newParams: Record<string, string>) => {
    return fetchData({ params: newParams });
  }, [fetchData]);

  return {
    ...state,
    fetchData,
    refetch,
    fetchWithParams
  };
}