<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\Sale;

class NotificationController extends Controller
{
    public function index()
    {
        $notifications = [];
        foreach (InventoryItem::with('supplier')->get()->filter(fn ($item) => $item->is_low_stock) as $item) {
            $notifications[] = [
                'id' => 'low-stock-'.$item->id, 'type' => 'low_stock', 'read' => false,
                'title' => 'Low stock: '.$item->name,
                'message' => 'Current quantity is '.$item->current_quantity.' '.$item->unit.'.',
                'resource' => ['type' => 'inventory_item', 'id' => $item->id],
                'created_at' => $item->updated_at,
            ];
        }
        foreach (Sale::whereColumn('paid_amount', '<', 'total_amount')->latest()->limit(25)->get() as $sale) {
            $notifications[] = [
                'id' => 'unpaid-sale-'.$sale->id, 'type' => 'unpaid_sale', 'read' => false,
                'title' => 'Outstanding sale #'.$sale->id,
                'message' => 'Remaining amount: '.$sale->remaining_amount,
                'resource' => ['type' => 'sale', 'id' => $sale->id],
                'created_at' => $sale->created_at,
            ];
        }

        return response()->json([
            'success' => true, 'data' => $notifications, 'unread_count' => count($notifications),
        ]);
    }
}
