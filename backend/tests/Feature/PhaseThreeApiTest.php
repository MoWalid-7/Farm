<?php
namespace Tests\Feature;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class PhaseThreeApiTest extends TestCase {
    use RefreshDatabase;
    public function test_weight_average_and_sale_totals_are_server_calculated(): void {
        $u=User::factory()->create(); $a=$this->actingAs($u);
        $cycle=$a->postJson('/api/v1/cycles',['name'=>'Batch 1','start_date'=>'2026-09-01','bird_count'=>100])->assertCreated()->json('data');
        $a->postJson('/api/v1/weights',['cycle_id'=>$cycle['id'],'bird_count'=>10,'total_weight'=>25,'recorded_date'=>'2026-09-10','average_weight'=>999])->assertCreated()->assertJsonPath('data.average_weight','2.500');
        $customer=$a->postJson('/api/v1/customers',['name'=>'Buyer'])->assertCreated()->json('data');
        $a->postJson('/api/v1/sales',['customer_id'=>$customer['id'],'cycle_id'=>$cycle['id'],'quantity'=>10,'weight'=>2.5,'price'=>4,'paid_amount'=>5,'sale_date'=>'2026-09-10','total_amount'=>1,'remaining_amount'=>1])
            ->assertCreated()->assertJsonPath('data.total_amount','100.00')->assertJsonPath('data.remaining_amount','95.00');
    }
    public function test_positive_values_and_overpayment_are_rejected(): void {
        $a=$this->actingAs(User::factory()->create());
        $a->postJson('/api/v1/cycles',['name'=>'Bad','start_date'=>'2026-09-01','bird_count'=>0])->assertStatus(422)->assertJsonValidationErrors('bird_count');
        $customer=$a->postJson('/api/v1/customers',['name'=>'Buyer'])->json('data');
        $a->postJson('/api/v1/sales',['customer_id'=>$customer['id'],'quantity'=>1,'weight'=>1,'price'=>1,'paid_amount'=>2,'sale_date'=>'2026-09-10'])->assertStatus(422)->assertJsonValidationErrors('paid_amount');
    }
}
