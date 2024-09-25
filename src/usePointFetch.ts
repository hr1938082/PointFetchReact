import { useContext, useState } from "react";
import Context from "./Context";
import PointFetch, { BaseConfig, Config } from "point-fetch";

export type usePointFetchStateKeyType<T extends Record<string, any>> = keyof T;

const usePointFetch = <T extends Record<string, any> = Record<string, any>>(initialState: T, initialProcessing?: boolean) => {
    const context = useContext(Context);
    const [data, setData] = useState<typeof initialState>(initialState);
    const [errors, setErrors] = useState<Record<usePointFetchStateKeyType<typeof initialState>, any> | Record<string, any>>({});
    const [processing, setProcessing] = useState(initialProcessing ?? false);

    const handleData = (key: usePointFetchStateKeyType<typeof initialState> | object, value?: string) => {
        setData(value !== undefined
            ? { ...data, [key as usePointFetchStateKeyType<typeof initialState>]: value }
            : typeof key === 'object' ? { ...data, ...key } : { ...data }
        );
    }

    const reset = (...fields: usePointFetchStateKeyType<typeof initialState>[]) => {
        if (fields.length === 0) {
            setData(initialState)
        } else {
            setData(
                Object.keys(initialState)
                    .filter((key) => fields.includes(key))
                    .reduce((carry, key) => {
                        const newkey: usePointFetchStateKeyType<typeof initialState> = key;
                        carry[newkey] = initialState[newkey]
                        return carry
                    }, { ...data }),
            )
        }
    }

    const handleErrors = (key: usePointFetchStateKeyType<typeof initialState>, value: string) => {
        setErrors(
            errors => ({
                ...errors,
                ...(value ? { [key]: value } : { key: '' }),
            })
        )
    }

    const clearError = (...fields: usePointFetchStateKeyType<typeof initialState>[]) => {
        setErrors((errors: any) => (
            Object.keys(errors).reduce(
                (carry, field) => ({
                    ...carry,
                    ...(fields.length > 0 && !fields.includes(field) ? { [field]: errors[field] } : {}),
                }),
                {}
            )
        ))
    }

    const submit = (options: Omit<Config, 'baseURL'>) => PointFetch({
        ...options,
        baseURL: context?.baseURL,
        headers: {
            ...context?.headers,
            ...options.headers
        },
        onStart: () => {
            !processing && setProcessing(true);
            typeof options.onStart === 'function' && options.onStart();
        },
        onSuccess: (res) => {
            setProcessing(false);
            typeof options.onSuccess === 'function' && options.onSuccess(res)
        },
        onError: (err, res) => {
            setProcessing(false);
            typeof options.onError === 'function' && options.onError(err, res)
            setErrors(err)
        },
        onServerError: (res) => {
            context?.onServerError && context.onServerError(res);
            options.onServerError && options.onServerError(res);
        },
        onUnAuthenticated: (res) => {
            context?.onUnAuthenticated && context.onUnAuthenticated(res);
            options.onUnAuthenticated && options.onUnAuthenticated(res);
        },
        onForbidden: (res) => {
            context?.onForbidden && context.onForbidden(res);
            options.onForbidden && options.onForbidden(res);
        },
        onFinish: () => options.onFinish && options.onFinish()
    })

    const get = (options: Omit<BaseConfig, 'baseURL'>) => submit({ ...options, method: 'get', data: {} });

    const post = (options: Omit<BaseConfig, 'baseURL'>) => submit({ ...options, method: 'post', data });

    const put = (options: Omit<BaseConfig, 'baseURL'>) => submit({ ...options, method: 'put', data });

    const patch = (options: Omit<BaseConfig, 'baseURL'>) => submit({ ...options, method: 'patch', data });

    const destroy = (options: Omit<BaseConfig, 'baseURL'>) => submit({ ...options, method: 'delete', data });

    return {
        get,
        post,
        put,
        patch,
        delete: destroy,
        data,
        setData: handleData,
        setProcessing,
        processing,
        reset,
        errors,
        setErrors: handleErrors,
        clearError
    }
}

export default usePointFetch