'use client'

import { DataTable } from "@/components/ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

interface Position{
    clientId: string,
    symbol: string;
    buyQuantity: number;
    sellQuantity: number;
    netQuantity: number;
}
const columns : ColumnDef<Position>[] = [
  {
    accessorKey: "symbol",
    header: "Symbol"
  },
  {
    accessorKey: "longTradePositions",
    header: "Buy Quantity"
  },
  {
    accessorKey: "shortTradePositions",
    header: "Sell Quantity"
  },
  {
    accessorKey: "netTradePositions",
    header: "Net Quantity"
  }
]

export default function Positioning(){
    const clients: string[] = ["BI ZRT", "BI VKF", "BI FTH"];
    const [selectedClient, setSelectedClient] = useState<string>("BI ZRT")
    const handleClientChange = (clientId: string) => {
        const client = clients.find(cl => cl === clientId);
        if(client){
            setSelectedClient(client);
        }
    }
    return (
        <div className="flex flex-col gap-4  mt-4">
            <div className="flex items-center justify-start flex-row gap-4 ">
                <p>Accounts:</p>
                <Select value={selectedClient} onValueChange={handleClientChange}>
                    <SelectTrigger className="w-64">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {clients.map((clientId) => (
                            <SelectItem key={clientId} value={clientId}>
                                {clientId}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div><div className="h-full w-full">
                    <DataTable columns={columns} data={[]} scrollAreaClassName="w-full h-full"></DataTable>
            </div>
        </div>
    )
}