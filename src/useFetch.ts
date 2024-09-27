import { useContext, useState } from "react";
import Context from "./Context";
import PointFetch, { BaseConfig, Config } from "point-fetch";

type StateKey<T> = Extract<keyof T, string>

type Error<T> = {
    [k in keyof T]?: string
}

type AnyError<T> = Error<T> & {
    [keys: string]: string | undefined
}

const useFetch = <T extends Record<string, any> = Record<string, any>>(initialState: T, initialProcessing?: boolean) => {
    const context = useContext(Context);
    const [data, setData] = useState<typeof initialState>(initialState);
    const [errors, setErrors] = useState<AnyError<T>>({});
    const [processing, setProcessing] = useState(initialProcessing ?? false);

    const handleData = (key: StateKey<T> | T & Record<string, any>, value?: string) => {
        setData(value !== undefined
            ? { ...data, [key as StateKey<T>]: value }
            : typeof key === 'object' ? { ...data, ...key } : { ...data }
        );
    }

    const reset = (...fields: StateKey<T>[]) => {
        if (fields.length === 0) {
            setData(initialState)
        } else {
            setData(
                Object.keys(initialState)
                    .filter((key) => fields.some(field => field === key))
                    .reduce((carry, key) => {
                        const newkey = key as StateKey<T>;
                        carry[newkey] = initialState[newkey]
                        return carry
                    }, { ...data }),
            )
        }
    }

    const handleErrors = (key: StateKey<T> | T & Record<string, any>, value?: string) => {
        setErrors(
            errors => (
                value !== undefined
                    ? { ...errors, [key as StateKey<T>]: value }
                    : typeof key === 'object' ? key : errors
            )
        )
    }

    const clearError = (...fields: StateKey<T>[]) => {
        setErrors((errors: any) => (
            Object.keys(errors).reduce(
                (carry, key) => ({
                    ...carry,
                    ...(fields.length > 0 && !fields.some(field => field === key) ? { [key]: errors[key] } : {}),
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

export default useFetch
