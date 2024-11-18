import { useContext, useState } from "react";
import Context from "./Context";
import PointFetch, { BaseConfig, Config } from "point-fetch";
import useValidator, { ValidatorOptions } from "point-validator-react";

type StateKey<T> = Extract<keyof T, string>

interface Options<T extends Record<string, any>> extends Omit<ValidatorOptions<T>, 'values'> {
    state: T,
    processing?: boolean
}

const useFetch = <T extends Record<string, any>>(options: Partial<Options<T>> = {}) => {
    const context = useContext(Context);
    const [Data, setData] = useState<T>(options.state ?? ({} as T));
    const [Processing, setProcessing] = useState(options.processing ?? false);
    const { validate, Errors, setErrors, clearError } = useValidator({ values: Data, rules: options.rules, message: options.message })

    const handleData = (key: StateKey<T> | T & Record<string, any>, value?: any) => {
        setData(value !== undefined
            ? { ...Data, [key as StateKey<T>]: value }
            : typeof key === 'object' ? { ...Data, ...key } : { ...Data }
        );
    }

    const reset = (...fields: StateKey<T>[]) => {
        if (fields.length === 0) {
            setData(options.state ?? ({} as T))
        } else {
            setData(
                Object.keys(options.state ?? ({} as T))
                    .filter((key) => fields.some(field => field === key))
                    .reduce((carry, key) => {
                        const newkey = key as StateKey<T>;
                        carry[newkey] = options.state?.[newkey] ?? ({} as T)[newkey]
                        return carry
                    }, { ...Data }),
            )
        }
    }

    const submit = (options: Omit<Config, 'baseURL'>) => PointFetch({
        ...options,
        baseURL: context?.baseURL,
        authorization: options.authorization ?? context?.authorization,
        onStart: () => {
            !Processing && setProcessing(true);
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

    const get = (options: Omit<BaseConfig, 'baseURL'>) => submit({
        ...options,
        method: 'get',
        data: {}
    });

    const post = (options: Omit<BaseConfig, 'baseURL'>) => submit({
        ...options,
        method: 'post',
        data: Data
    });

    const put = (options: Omit<BaseConfig, 'baseURL'>) => submit({
        ...options,
        method: 'put',
        data: Data
    });

    const patch = (options: Omit<BaseConfig, 'baseURL'>) => submit({
        ...options,
        method: 'patch',
        data: Data
    });

    const destroy = (options: Omit<BaseConfig, 'baseURL'>) => submit({
        ...options,
        method: 'delete',
        data: Data
    });

    return {
        get,
        post,
        put,
        patch,
        destroy,
        Data,
        setData: handleData,
        reset,
        setProcessing,
        Processing,
        Errors,
        setErrors,
        validate,
        clearError
    }
}

export default useFetch
