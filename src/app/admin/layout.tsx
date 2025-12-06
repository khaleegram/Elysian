
import { ReactNode } from "react";
import { AdminLayoutClient } from "./layout-client";


export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <AdminLayoutClient>
            {children}
        </AdminLayoutClient>
    );
}
