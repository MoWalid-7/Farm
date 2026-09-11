<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryTransaction extends Model
{
    use HasFactory;
    protected $fillable = ['inventory_item_id', 'type', 'quantity', 'reference', 'notes', 'transaction_date'];
    protected $casts = ['quantity' => 'decimal:3', 'transaction_date' => 'date'];

    public function inventoryItem(): BelongsTo { return $this->belongsTo(InventoryItem::class); }
    public function directionMultiplier(): int
    {
        if ($this->type === 'adjustment') return 1;
        return in_array($this->type, ['usage', 'sale', 'waste', 'out'], true) ? -1 : 1;
    }
    public function signedQuantity(): float { return (float) $this->quantity * $this->directionMultiplier(); }
}
