<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryItem extends Model
{
    use HasFactory;
    protected $fillable = ['supplier_id', 'name', 'sku', 'unit', 'minimum_stock', 'description'];
    protected $casts = ['minimum_stock' => 'decimal:3'];
    protected $appends = ['current_quantity', 'is_low_stock'];

    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function transactions(): HasMany { return $this->hasMany(InventoryTransaction::class); }
    public function getCurrentQuantityAttribute(): string
    {
        $sum = $this->transactions()->get()->sum(fn ($transaction) => $transaction->signedQuantity());
        return number_format((float) $sum, 3, '.', '');
    }
    public function getIsLowStockAttribute(): bool
    {
        return (float) $this->current_quantity <= (float) $this->minimum_stock;
    }
}
