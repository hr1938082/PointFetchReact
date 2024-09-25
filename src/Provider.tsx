import { FC, ReactNode } from "react"
import Context, { ContextType } from "./Context"

export interface ProviderProps extends ContextType {
    children: ReactNode
}

const Provider: FC<ProviderProps> = ({ children, ...restProps }) => {
    return (
        <Context.Provider value={restProps}>
            {children}
        </Context.Provider>
    )
}

export default Provider