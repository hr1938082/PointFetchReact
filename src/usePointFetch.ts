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

    const submit = (options: Config) => PointFetch({
        ...options,
        baseURL: context?.baseURL,
        headers: context?.headers,
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
            if (res.status === 500) {
                context?.onServerError && context.onServerError(res)
            } else if (res.status === 401) {
                context?.onUnAuthenticated && context.onUnAuthenticated(res)
            } else if (res.status === 403) {
                context?.onForbidden && context.onForbidden(res)
            } else {
                setErrors(err)
            }
        },
        onFinish: () => options.onFinish && options.onFinish()
    })

    const get = (options: BaseConfig) => submit({ ...options, method: 'get', data: {} });

    const post = (options: BaseConfig) => submit({ ...options, method: 'post', data });

    const put = (options: BaseConfig) => submit({ ...options, method: 'put', data });

    const patch = (options: BaseConfig) => submit({ ...options, method: 'patch', data });

    const destroy = (options: BaseConfig) => submit({ ...options, method: 'delete', data });

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