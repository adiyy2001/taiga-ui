import {
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import {ChangeDetectionStrategy, Component, viewChild} from '@angular/core';
import {type ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {TuiTable, TuiTableControl} from '@taiga-ui/addon-table';
import {TuiCheckbox} from '@taiga-ui/core';

const ROW_HEIGHT = 10;
const VIEWPORT_HEIGHT = 100;
const ITEMS = Array.from({length: 100}, (_, index) => `item-${index}`);

describe('TuiTableControl with virtual scroll', () => {
    @Component({
        imports: [
            CdkFixedSizeVirtualScroll,
            CdkVirtualForOf,
            CdkVirtualScrollViewport,
            FormsModule,
            TuiCheckbox,
            TuiTable,
            TuiTableControl,
        ],
        template: `
            <cdk-virtual-scroll-viewport
                [itemSize]="rowHeight"
                [maxBufferPx]="0"
                [minBufferPx]="0"
            >
                <table
                    tuiTable
                    [(ngModel)]="selected"
                >
                    <tbody>
                        <tr *cdkVirtualFor="let item of items; templateCacheSize: 0">
                            <td>
                                <input
                                    tuiCheckbox
                                    type="checkbox"
                                    [tuiCheckboxRow]="item"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </cdk-virtual-scroll-viewport>
        `,
        changeDetection: ChangeDetectionStrategy.OnPush,
    })
    class Test {
        public selected: readonly string[] = ITEMS;
        public readonly viewport = viewChild.required(CdkVirtualScrollViewport);

        protected readonly items = ITEMS;
        protected readonly rowHeight = ROW_HEIGHT;
    }

    let fixture: ComponentFixture<Test>;
    let scrollOffset = 0;

    const checkboxes = (): HTMLInputElement[] =>
        Array.from(fixture.nativeElement.querySelectorAll('input[tuiCheckbox]'));

    const render = async (): Promise<void> => {
        for (let pass = 0; pass < 3; pass++) {
            fixture.detectChanges();
            await fixture.whenStable();
        }
    };

    const scrollTo = async (offset: number): Promise<void> => {
        scrollOffset = offset;
        fixture.componentInstance.viewport().checkViewportSize();
        fixture.componentInstance.viewport()['_scrollStrategy'].onContentScrolled();
        await render();
    };

    beforeEach(async () => {
        scrollOffset = 0;
        jest.spyOn(
            CdkVirtualScrollViewport.prototype,
            'measureViewportSize',
        ).mockReturnValue(VIEWPORT_HEIGHT);
        jest.spyOn(
            CdkVirtualScrollViewport.prototype,
            'measureScrollOffset',
        ).mockImplementation(() => scrollOffset);
        TestBed.configureTestingModule({imports: [Test]});
        await TestBed.compileComponents();
        fixture = TestBed.createComponent(Test);
        await render();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('renders only the visible rows', () => {
        expect(checkboxes()).toHaveLength(VIEWPORT_HEIGHT / ROW_HEIGHT);
    });

    it('keeps rows selected after they are scrolled out of view', async () => {
        checkboxes()[0]?.click();
        await render();
        await scrollTo(600);
        await scrollTo(0);

        expect(fixture.componentInstance.selected).toEqual(ITEMS.slice(1));
        expect(checkboxes().map(({checked}) => checked)).toEqual([
            false,
            ...Array.from({length: 9}, () => true),
        ]);
    });
});
