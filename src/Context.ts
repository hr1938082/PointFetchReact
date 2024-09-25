import { BaseOptions, ErrorEvents } from "point-fetch";
import { createContext } from "react";

export type ContextOptions = Omit<BaseOptions, 'endPoint' | 'url' | 'data'>

export type ContextType = ErrorEvents & ContextOptions

export default createContext<ContextType | undefined>(undefined);