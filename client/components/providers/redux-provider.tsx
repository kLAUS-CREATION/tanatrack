import React from "react";

import { Provider } from "react-redux";
import { makeStore } from "@/lib/features/store";

const store = makeStore();
export default function ReduxProvider ( { children } : { children: React.ReactNode } ) {
    return <Provider store={store}>
        { children }
    </Provider>
}
