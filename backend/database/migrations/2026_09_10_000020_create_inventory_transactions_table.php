<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_item_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['purchase', 'usage', 'sale', 'waste', 'return', 'in', 'out', 'adjustment']);
            $table->decimal('quantity', 14, 3);
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->date('transaction_date');
            $table->timestamps();
            $table->index(['inventory_item_id', 'transaction_date']);
        });
    }

    public function down(): void { Schema::dropIfExists('inventory_transactions'); }
};
