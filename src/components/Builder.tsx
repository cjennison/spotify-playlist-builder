"use client";

import { useEffect, useState } from "react";
import {
  ActionIcon,
  Alert,
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Slider,
  Stack,
  Switch,
  Text,
  TextInput,
  TagsInput,
  Title,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useDebouncedValue } from "@mantine/hooks";
import {
  IconAlertTriangle,
  IconBrandSpotify,
  IconCheck,
  IconExternalLink,
  IconMusic,
  IconPlus,
  IconSparkles,
  IconUsersGroup,
  IconX,
} from "@tabler/icons-react";
import type { Identity, ResolvedTrack, TrackSource } from "@/types";

interface GenerateResponse {
  name: string;
  description: string;
  tracks: ResolvedTrack[];
}

const ACCENTS = ["teal", "blue", "grape", "orange", "pink", "cyan"];
const emptyIdentity = (): Identity => ({ name: "", artists: [] });

const SOURCE_META: Record<
  TrackSource,
  { label: string; color: string }
> = {
  known: { label: "known", color: "teal" },
  discovery: { label: "discovery", color: "grape" },
  overlap: { label: "shared", color: "yellow" },
};

/** Artist input with live Spotify autocomplete (free text still allowed). */
function ArtistTagsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [data, setData] = useState<string[]>([]);
  const [debounced] = useDebouncedValue(search, 250);

  useEffect(() => {
    const q = debounced.trim();
    if (q.length < 2) {
      setData([]);
      return;
    }
    let active = true;
    fetch(`/api/spotify/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        const names: string[] = (d.artists ?? []).map(
          (a: { name: string }) => a.name
        );
        setData(
          Array.from(new Set(names)).filter((n) => !value.includes(n))
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [debounced, value]);

  return (
    <TagsInput
      variant="filled"
      label="Liked artists"
      placeholder={value.length ? "Add another…" : "Search e.g. Cake"}
      value={value}
      onChange={onChange}
      searchValue={search}
      onSearchChange={setSearch}
      data={data}
      clearable
      splitChars={[",", "\n"]}
    />
  );
}

function StepHeader({
  step,
  title,
  hint,
  right,
}: {
  step: number;
  title: string;
  hint?: string;
  right?: React.ReactNode;
}) {
  return (
    <Group justify="space-between" align="center" wrap="nowrap">
      <Group gap="sm" align="center" wrap="nowrap">
        <span className="step-badge">{step}</span>
        <Box>
          <Title order={2} style={{ letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            {title}
          </Title>
          {hint && (
            <Text c="dimmed" fz="sm">
              {hint}
            </Text>
          )}
        </Box>
      </Group>
      {right}
    </Group>
  );
}

export default function Builder({ spotifyLinked }: { spotifyLinked: boolean }) {
  const [identities, setIdentities] = useState<Identity[]>([
    { name: "", artists: [] },
    { name: "", artists: [] },
  ]);
  const [size, setSize] = useState(20);
  const [knownRatio, setKnownRatio] = useState(0.6);

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  function updateIdentity(idx: number, patch: Partial<Identity>) {
    setIdentities((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );
  }
  function addIdentity() {
    setIdentities((prev) => [...prev, emptyIdentity()]);
  }
  function removeIdentity(idx: number) {
    setIdentities((prev) => prev.filter((_, i) => i !== idx));
  }

  function cleanedIdentities(): Identity[] {
    return identities
      .map((i) => ({
        name: i.name.trim(),
        artists: i.artists.map((a) => a.trim()).filter(Boolean),
      }))
      .filter((i) => i.name && i.artists.length > 0);
  }

  async function generate() {
    setError(null);
    setResult(null);
    setPlaylistUrl(null);
    const cleaned = cleanedIdentities();
    if (cleaned.length < 2) {
      setError("Add at least two people, each with a name and one artist.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identities: cleaned, size, knownRatio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate.");
      setResult(data as GenerateResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate.");
    } finally {
      setLoading(false);
    }
  }

  async function createPlaylist() {
    if (!result) return;
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.name,
          description: result.description,
          uris: result.tracks.map((t) => t.uri),
          isPublic,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create playlist.");
      setPlaylistUrl(data.url);
      notifications.show({
        color: "teal",
        icon: <IconCheck size={16} />,
        title: "Playlist created",
        message: "Your blended playlist is now in Spotify.",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create playlist.";
      setError(msg);
      notifications.show({ color: "red", title: "Couldn't save", message: msg });
    } finally {
      setCreating(false);
    }
  }

  const knownPct = Math.round(knownRatio * 100);
  const totalArtists = identities.reduce(
    (n, i) => n + i.artists.filter(Boolean).length,
    0
  );
  const ready = cleanedIdentities().length >= 2;

  return (
    <Container size={860} py={48}>
      <Stack gap={44}>
        {/* Hero */}
        <Stack gap="xs">
          <Text
            fz="xs"
            fw={700}
            c="dimmed"
            tt="uppercase"
            style={{ letterSpacing: "0.18em" }}
          >
            AI Playlist Studio
          </Text>
          <Title order={1} style={{ letterSpacing: "-0.035em" }}>
            Create a <span className="gradient-text">blend</span>
          </Title>
          <Text c="dimmed" fz="lg" maw={560}>
            Add everyone&apos;s favorite artists, dial in the vibe, and let the
            AI weave them into one shared playlist.
          </Text>
        </Stack>

        {!spotifyLinked && (
          <Alert
            variant="light"
            color="yellow"
            radius="md"
            icon={<IconAlertTriangle size={18} />}
            title="Connect Spotify to continue"
          >
            Link your Spotify account with the button in the top-right to
            generate and save playlists.
          </Alert>
        )}

        {/* Step 1 — People */}
        <Stack gap="lg">
          <StepHeader
            step={1}
            title="People"
            hint="Two or more — add a few artists each."
            right={
              <Badge
                size="lg"
                radius="sm"
                variant="light"
                color="teal"
                leftSection={<IconUsersGroup size={14} />}
              >
                {identities.length} · {totalArtists} artists
              </Badge>
            }
          />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {identities.map((identity, idIdx) => {
              const accent = ACCENTS[idIdx % ACCENTS.length];
              const initial = identity.name.trim()
                ? identity.name.trim()[0].toUpperCase()
                : String(idIdx + 1);
              return (
                <Card
                  key={idIdx}
                  className="person-card"
                  withBorder
                  radius="lg"
                  padding="lg"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <Stack gap="md">
                    <Group gap="sm" wrap="nowrap">
                      <Avatar
                        radius="xl"
                        size={44}
                        color={accent}
                        variant="filled"
                      >
                        {initial}
                      </Avatar>
                      <TextInput
                        flex={1}
                        size="md"
                        variant="filled"
                        placeholder={`Person ${idIdx + 1}`}
                        value={identity.name}
                        onChange={(e) =>
                          updateIdentity(idIdx, { name: e.currentTarget.value })
                        }
                      />
                      {identities.length > 2 && (
                        <Tooltip label="Remove" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="lg"
                            aria-label="Remove person"
                            onClick={() => removeIdentity(idIdx)}
                          >
                            <IconX size={18} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>

                    <ArtistTagsInput
                      value={identity.artists}
                      onChange={(value) =>
                        updateIdentity(idIdx, { artists: value })
                      }
                    />
                  </Stack>
                </Card>
              );
            })}

            <UnstyledButton
              className="ghost-card"
              onClick={addIdentity}
              aria-label="Add person"
            >
              <Stack align="center" justify="center" gap={6} h="100%" py="xl">
                <IconPlus size={22} />
                <Text fz="sm" fw={600}>
                  Add person
                </Text>
              </Stack>
            </UnstyledButton>
          </SimpleGrid>
        </Stack>

        {/* Step 2 — Vibe */}
        <Stack gap="lg">
          <StepHeader step={2} title="Vibe" hint="Size and the discovery mix." />
          <Card
            withBorder
            radius="lg"
            padding="xl"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <Stack gap={36}>
              <Box>
                <Group justify="space-between" mb="sm">
                  <Text fw={600}>Playlist size</Text>
                  <Badge variant="light" color="gray" radius="sm" size="lg">
                    {size} tracks
                  </Badge>
                </Group>
                <Slider
                  color="teal"
                  size="lg"
                  min={4}
                  max={50}
                  value={size}
                  onChange={setSize}
                  marks={[
                    { value: 4, label: "4" },
                    { value: 25, label: "25" },
                    { value: 50, label: "50" },
                  ]}
                />
              </Box>

              <Box>
                <Group justify="space-between" mb="sm">
                  <Text fw={600}>Known vs. discovery</Text>
                  <Badge variant="light" color="teal" radius="sm" size="lg">
                    {knownPct}% known · {100 - knownPct}% discovery
                  </Badge>
                </Group>
                <Slider
                  color="teal"
                  size="lg"
                  min={0}
                  max={100}
                  value={knownPct}
                  onChange={(v) => setKnownRatio(v / 100)}
                  mb="md"
                  marks={[
                    { value: 0, label: "Discover" },
                    { value: 100, label: "Familiar" },
                  ]}
                />
                <div className="ratio-bar" style={{ marginTop: 28 }}>
                  <div
                    style={{
                      width: `${knownPct}%`,
                      background: "linear-gradient(90deg,#1db954,#4bd680)",
                    }}
                  />
                  <div
                    style={{
                      width: `${100 - knownPct}%`,
                      background:
                        "linear-gradient(90deg,#7c4dff,#b14bd6)",
                    }}
                  />
                </div>
                <Group justify="space-between" mt={8}>
                  <Text fz="xs" c="dimmed">
                    Known artists
                  </Text>
                  <Text fz="xs" c="dimmed">
                    Discoveries
                  </Text>
                </Group>
              </Box>
            </Stack>
          </Card>
        </Stack>

        {/* Step 3 — Blend */}
        <Stack gap="lg">
          <StepHeader step={3} title="Blend" hint="Generate and save to Spotify." />
          <Button
            size="xl"
            radius="md"
            fullWidth
            variant="gradient"
            gradient={{ from: "teal", to: "brand.7", deg: 100 }}
            loading={loading}
            disabled={!spotifyLinked || !ready}
            leftSection={<IconSparkles size={20} />}
            onClick={generate}
            styles={{ root: { height: 56, fontSize: 16 } }}
          >
            {loading ? "Blending tastes…" : "Generate playlist"}
          </Button>
          {!ready && spotifyLinked && (
            <Text c="dimmed" fz="xs" ta="center">
              Add at least two people with artists to continue.
            </Text>
          )}
        </Stack>

        {error && (
          <Alert
            variant="light"
            color="red"
            radius="md"
            icon={<IconAlertTriangle size={18} />}
            withCloseButton
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Results */}
        {result && (
          <Stack gap="md">
            <Divider
              label="Your blend"
              labelPosition="center"
              color="var(--border)"
            />
            <Paper
              withBorder
              radius="lg"
              p="lg"
              style={{
                borderColor: "var(--border)",
                background:
                  "linear-gradient(135deg, rgba(29,185,84,0.10), rgba(124,77,255,0.06)), var(--surface)",
              }}
            >
              <Group justify="space-between" align="flex-end" wrap="wrap">
                <Stack gap={4}>
                  <Title order={2} style={{ letterSpacing: "-0.02em" }}>
                    {result.name}
                  </Title>
                  <Text c="dimmed" fz="sm" maw={460}>
                    {result.description}
                  </Text>
                  <Text c="dimmed" fz="xs" mt={2}>
                    {result.tracks.length} tracks matched on Spotify
                    {(() => {
                      const shared = result.tracks.filter(
                        (t) => t.source === "overlap"
                      ).length;
                      return shared > 0 ? ` · ${shared} shared` : "";
                    })()}
                  </Text>
                </Stack>
                <Group gap="md">
                  <Switch
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.currentTarget.checked)}
                    label="Public"
                    color="teal"
                  />
                  <Button
                    radius="xl"
                    size="md"
                    color="teal"
                    loading={creating}
                    leftSection={<IconBrandSpotify size={18} />}
                    onClick={createPlaylist}
                  >
                    Save to Spotify
                  </Button>
                </Group>
              </Group>
            </Paper>

            {playlistUrl && (
              <Alert
                variant="light"
                color="teal"
                radius="md"
                icon={<IconCheck size={18} />}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Text fz="sm">Playlist created in your Spotify library.</Text>
                  <Anchor
                    href={playlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    fz="sm"
                    fw={600}
                  >
                    <Group gap={4} wrap="nowrap">
                      Open <IconExternalLink size={14} />
                    </Group>
                  </Anchor>
                </Group>
              </Alert>
            )}

            <Paper
              withBorder
              radius="lg"
              style={{
                overflow: "hidden",
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              {result.tracks.map((t, i) => {
                const meta = SOURCE_META[t.source] ?? SOURCE_META.discovery;
                const isOverlap = t.source === "overlap";
                return (
                  <Box key={t.uri + i}>
                    {i > 0 && <Divider color="var(--border)" />}
                    <Group
                      gap="md"
                      wrap="nowrap"
                      p="sm"
                      style={{
                        background: isOverlap
                          ? "linear-gradient(90deg, rgba(250,204,21,0.10), transparent 70%)"
                          : undefined,
                      }}
                    >
                      <Text fz="xs" c="dimmed" w={22} ta="right" ff="monospace">
                        {i + 1}
                      </Text>
                      <Avatar src={t.albumImage} radius="md" size={46}>
                        <IconMusic size={20} />
                      </Avatar>
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Text fz="sm" fw={600} truncate>
                          {t.spotifyTitle}
                        </Text>
                        <Text fz="xs" c="dimmed" truncate>
                          {t.spotifyArtist}
                        </Text>
                      </Box>
                      <Stack gap={4} align="flex-end">
                        <Badge
                          size="sm"
                          radius="sm"
                          variant={isOverlap ? "filled" : "light"}
                          color={meta.color}
                          leftSection={
                            isOverlap ? <IconUsersGroup size={11} /> : undefined
                          }
                        >
                          {meta.label}
                        </Badge>
                        <Text fz={10} c="dimmed" ta="right">
                          {t.identity}
                        </Text>
                      </Stack>
                    </Group>
                  </Box>
                );
              })}
            </Paper>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
