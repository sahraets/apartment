-- items.kind: hva slags møbel tingen er, slik at spillet kan tegne den.
--
-- Nullbar med vilje: en ting uten møbeltype (f.eks. «gardiner» eller
-- «malingsspann») vises bare i lista, ikke på kartet.
--
-- Ingen check-constraint på verdiene her. Lista over møbeltyper bor i koden
-- (`types/index.ts` -> FurnitureKind, med størrelse og farge i
-- `game/furniture.ts`), og valideres i /server/services/itemService.ts. Da
-- slipper vi en ny migrasjon hver gang vi finner på en ny møbeltype.

alter table public.items
  add column if not exists kind text;

comment on column public.items.kind is
  'Møbeltype spillet tegner (sofa, spisebord, stol, ...). NULL = vises ikke på kartet.';
