<?php

namespace App\Services;

use App\Models\{InventoryItem, InventoryTransaction};
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    public function item(array $data, ?InventoryItem $item = null): InventoryItem
    {
        return DB::transaction(function () use ($data, $item) {
            $item ? $item->update($data) : $item = InventoryItem::create($data);
            return $item->fresh(['supplier']);
        });
    }

    public function transaction(array $data, ?InventoryTransaction $transaction = null): InventoryTransaction
    {
        return DB::transaction(function () use ($data, $transaction) {
            $itemId = $data['inventory_item_id'] ?? $transaction->inventory_item_id;
            $item = InventoryItem::whereKey($itemId)->lockForUpdate()->firstOrFail();
            $existing = $transaction ? $transaction->signedQuantity() : 0;
            $type = $data['type'] ?? $transaction->type;
            $quantity = (float) ($data['quantity'] ?? $transaction->quantity);
            $delta = $type === 'adjustment' ? $quantity : $quantity * (in_array($type, ['usage', 'sale', 'waste', 'out'], true) ? -1 : 1);
            $current = $item->transactions()->get()->sum(fn ($t) => $t->signedQuantity()) - $existing;
            if ($current + $delta < -0.000001) {
                throw ValidationException::withMessages(['quantity' => ['This transaction would make stock negative.']]);
            }
            $transaction ? $transaction->update($data) : $transaction = InventoryTransaction::create($data);
            return $transaction->fresh(['inventoryItem']);
        });
    }

    public function deleteTransaction(InventoryTransaction $transaction): void
    {
        DB::transaction(function () use ($transaction) {
            $item = InventoryItem::whereKey($transaction->inventory_item_id)->lockForUpdate()->firstOrFail();
            $remaining = $item->transactions()->where('id', '!=', $transaction->id)->get()->sum(fn ($t) => $t->signedQuantity());
            if ($remaining < -0.000001) throw ValidationException::withMessages(['transaction' => ['Stock cannot become negative.']]);
            $transaction->delete();
        });
    }
}
