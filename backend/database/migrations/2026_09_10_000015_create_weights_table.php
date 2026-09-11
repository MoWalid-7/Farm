<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('weights', function (Blueprint $table) {
            $table->id(); $table->foreignId('cycle_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('bird_count'); $table->decimal('total_weight',12,3);
            $table->decimal('average_weight',12,3); $table->date('recorded_date'); $table->timestamps();
            $table->index(['cycle_id','recorded_date']);
        });
    }
    public function down(): void { Schema::dropIfExists('weights'); }
};
