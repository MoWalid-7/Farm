<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('sales', function (Blueprint $table) {
            $table->id(); $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->foreignId('cycle_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('quantity'); $table->decimal('weight',12,3)->nullable();
            $table->decimal('price',12,2); $table->decimal('total_amount',12,2);
            $table->decimal('paid_amount',12,2)->default(0); $table->decimal('remaining_amount',12,2);
            $table->date('sale_date'); $table->timestamps();
            $table->index(['customer_id','sale_date']);
        });
    }
    public function down(): void { Schema::dropIfExists('sales'); }
};
