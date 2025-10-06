import { useState, useEffect, useCallback } from 'react';

const useApi = (apiFunction, dependencies = []) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const execute = useCallback(async (...args) => {
        try {
            setLoading(true);
            setError(null);
            const result = await apiFunction(...args);
            setData(result);
            return result;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiFunction]);

    useEffect(() => {
        if (dependencies.length > 0) {
            execute();
        }
    }, [execute, ...dependencies]);

    return {
        data,
        loading,
        error,
        execute,
        setData,
        setError,
    };
};

export default useApi;
