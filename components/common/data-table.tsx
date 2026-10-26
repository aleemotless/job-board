import { cn } from "cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DataTableColumn } from "@/types";
import { Notice } from "./notice";

type DataTableProps<Row extends { id: string }> = {
    rows: Row[];
    columns: DataTableColumn<Row>[];
    emptyMessage: string;
    // Shown as the card's heading.
    title?: string;
    hideHeader?: boolean;
};

// Edge columns get the card's inner padding; right-aligned columns align their text.
function cellClassName<Row>(column: DataTableColumn<Row>, index: number, count: number) {
    return cn((index === 0 || index === count - 1) && "px-4", column.align === "right" && "text-right");
}

// A table in a card, with an empty state. Rows need a stable `id` for keys.
export function DataTable<Row extends { id: string }>({ rows, columns, emptyMessage, title, hideHeader = false }: DataTableProps<Row>) {
    return (
        <Card className={cn(!title && "py-0")}>
            {title && (
                <CardHeader>
                    <CardTitle>
                        <h2 className="text-2xl">{title}</h2>
                    </CardTitle>
                </CardHeader>
            )}
            {rows.length === 0 ? (
                <CardContent className={cn(!title && "py-4")}>
                    <Notice>{emptyMessage}</Notice>
                </CardContent>
            ) : (
                <CardContent className="px-0">
                    <Table>
                        {!hideHeader && (
                            <TableHeader>
                                <TableRow>
                                    {columns.map((column, index) => (
                                        <TableHead key={column.header} className={cn("label-caps", cellClassName(column, index, columns.length))}>
                                            {column.header}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                        )}
                        <TableBody>
                            {rows.map((row) => (
                                <TableRow key={row.id}>
                                    {columns.map((column, index) => (
                                        <TableCell key={column.header} className={cellClassName(column, index, columns.length)}>
                                            {column.cell(row)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            )}
        </Card>
    );
}
